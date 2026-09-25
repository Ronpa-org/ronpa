"""APIの基本契約を外部サービス・実際のAPIキーなしで検証する。"""

import os
import unittest
from unittest.mock import MagicMock, patch

# import時のdotenv読み込みや手元のキーによる課金を避ける。
os.environ["OPENAI_API_KEY"] = ""
os.environ["PYTHON_DOTENV_DISABLED"] = "1"
os.environ["FRONTEND_ORIGINS"] = "http://localhost:3000"

from fastapi.testclient import TestClient

from app import debate
from app.main import app


class DebateApiTests(unittest.TestCase):
    def setUp(self):
        self.network = patch(
            "socket.socket.connect",
            side_effect=AssertionError("Tests must not access external services"),
        )
        self.network.start()
        self.addCleanup(self.network.stop)
        debate._sessions.clear()
        self.addCleanup(debate._sessions.clear)
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def assert_scores(self, result):
        self.assertEqual(
            set(result["scores"]), {"logic", "persuasion", "rebuttal", "structure"}
        )
        for value in result["scores"].values():
            self.assertIsInstance(value, int)
            self.assertGreaterEqual(value, 0)
            self.assertLessEqual(value, 10)
        self.assertEqual(result["total"], sum(result["scores"].values()))

    def start_debate(self, **options):
        response = self.client.post("/api/debate/start", json=options)
        self.assertEqual(response.status_code, 200, response.text)
        return response.json()

    def test_health_reports_mock_mode(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok", "mock": True})

    def test_debate_round_trip_for_languages_sides_and_levels(self):
        for language in ("ja", "en"):
            for side in ("肯定", "否定"):
                for level in ("easy", "normal", "hard", "oni"):
                    with self.subTest(language=language, side=side, level=level):
                        session = self.start_debate(
                            language=language, user_side=side, level=level
                        )
                        self.assertEqual(session["user_side"], side)
                        self.assertNotEqual(session["ai_side"], side)
                        self.assertEqual(session["level"], level)
                        self.assertEqual(session["language"], language)
                        self.assertTrue(session["theme"])
                        self.assertTrue(session["opening"])
                        reply = self.client.post(
                            "/api/debate/message",
                            json={"debate_id": session["debate_id"], "message": "Test argument"},
                        )
                        self.assertEqual(reply.status_code, 200, reply.text)
                        self.assertTrue(reply.json()["reply"])
                        self.assertFalse(reply.json()["ended"])
                        score = self.client.post(
                            "/api/debate/score", json={"debate_id": session["debate_id"]}
                        )
                        self.assertEqual(score.status_code, 200, score.text)
                        result = score.json()
                        self.assert_scores(result)
                        self.assertEqual(result["theme"], session["theme"])
                        self.assertEqual(result["language"], language)
                        self.assertEqual(result["user_side"], side)
                        self.assertIn(result["winner"], ("user", "ai"))
                        self.assertEqual(result["turns"], 3 if side == "否定" else 2)

    def test_unknown_sessions_are_not_found(self):
        for endpoint in ("message", "score"):
            with self.subTest(endpoint=endpoint):
                response = self.client.post(
                    f"/api/debate/{endpoint}",
                    json={"debate_id": "does-not-exist", "message": "hello"},
                )
                self.assertEqual(response.status_code, 404)

    def test_invalid_messages_do_not_change_session(self):
        session = self.start_debate(user_side="肯定")
        for message in ("", "x" * 2001):
            with self.subTest(length=len(message)):
                response = self.client.post(
                    "/api/debate/message",
                    json={"debate_id": session["debate_id"], "message": message},
                )
                self.assertEqual(response.status_code, 422)
        self.assertEqual(debate.get_session(session["debate_id"])["messages"], [])

    def test_sessions_are_isolated(self):
        first = self.start_debate(theme="First topic")
        second = self.start_debate(theme="Second topic")
        self.assertNotEqual(first["debate_id"], second["debate_id"])
        self.client.post(
            "/api/debate/message",
            json={"debate_id": first["debate_id"], "message": "Only first session"},
        )
        second_score = self.client.post(
            "/api/debate/score", json={"debate_id": second["debate_id"]}
        ).json()
        self.assertEqual(second_score["turns"], 0)
        self.assertEqual(second_score["theme"], "Second topic")

    def test_versus_scores_both_sides(self):
        for language in ("ja", "en"):
            with self.subTest(language=language):
                response = self.client.post(
                    "/api/versus/score",
                    json={
                        "theme": "Test topic",
                        "language": language,
                        "transcript": [
                            {"side": "肯定", "name": "Host", "text": "Pro argument"},
                            {"side": "否定", "name": "Guest", "text": "Con argument"},
                        ],
                    },
                )
                self.assertEqual(response.status_code, 200, response.text)
                result = response.json()
                self.assertEqual(result["language"], language)
                self.assertIn(result["winner"], ("肯定", "否定"))
                self.assert_scores(result["affirmative"])
                self.assert_scores(result["negative"])

    def test_versus_rejects_missing_or_oversized_topic(self):
        for theme in ("", "x" * 201):
            with self.subTest(length=len(theme)):
                response = self.client.post("/api/versus/score", json={"theme": theme})
                self.assertEqual(response.status_code, 422)

    def test_openai_failure_falls_back_to_demo(self):
        fake_client = MagicMock()
        fake_client.chat.completions.create.side_effect = RuntimeError("Test outage")
        with patch.object(debate, "MOCK_MODE", False), patch.object(
            debate, "_client", fake_client, create=True
        ):
            session = self.start_debate(user_side="否定", language="en")
            reply = self.client.post(
                "/api/debate/message",
                json={"debate_id": session["debate_id"], "message": "Test argument"},
            )
            self.assertEqual(reply.status_code, 200)
            self.assertIn("Demo", reply.json()["reply"])
            score = self.client.post(
                "/api/debate/score", json={"debate_id": session["debate_id"]}
            )
            self.assertEqual(score.status_code, 200)
            self.assertIn("Demo", score.json()["summary"])
            self.assert_scores(score.json())
            versus = self.client.post(
                "/api/versus/score", json={"theme": "Test topic", "language": "en"}
            )
            self.assertEqual(versus.status_code, 200)
            self.assertIn("Demo", versus.json()["comment"])
            self.assertEqual(fake_client.chat.completions.create.call_count, 4)

    def test_cors_only_allows_configured_origin(self):
        for origin, expected_status in (
            ("http://localhost:3000", 200), ("https://untrusted.example", 400)
        ):
            with self.subTest(origin=origin):
                response = self.client.options(
                    "/api/debate/start",
                    headers={"Origin": origin, "Access-Control-Request-Method": "POST"},
                )
                self.assertEqual(response.status_code, expected_status)
                if expected_status == 200:
                    self.assertEqual(response.headers["access-control-allow-origin"], origin)
                else:
                    self.assertNotIn("access-control-allow-origin", response.headers)


if __name__ == "__main__":
    unittest.main()
