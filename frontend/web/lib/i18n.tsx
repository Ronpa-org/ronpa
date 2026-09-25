"use client";

// JP/EN 切り替え（UI文言＋モック表示データ）
import {
  createContext,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type Lang = "ja" | "en";
const STORAGE_KEY = "ronpa:lang";

const ja = {
  nav: { home: "ホーム", battle: "対戦", mypage: "マイページ" },
  side: { 肯定: "肯定側", 否定: "否定側" },
  levels: { easy: "簡単", normal: "普通", hard: "難しい", oni: "鬼" },
  splash: {
    catch1: "日本初、リアルタイム対人ディベート × AI採点",
    catch2: "論理的思考力と説得力を「実践」で鍛える道場",
    signup: "新規登録で始める",
    login: "ログイン",
    terms:
      "登録すると利用規約とプライバシーポリシーに同意したものとみなされます",
    termsLabel: "利用規約",
    privacyLabel: "プライバシーポリシー",
  },
  auth: {
    signupTitle: "新規登録",
    loginTitle: "ログイン",
    signupSub: "メールアドレスとパスワードで登録します",
    loginSub: "登録済みのアカウントでログイン",
    email: "メールアドレス",
    emailPh: "you@example.com",
    password: "パスワード",
    passwordPh: "6文字以上",
    signupBtn: "登録する",
    loginBtn: "ログイン",
    processing: "処理中…",
    toLogin: "アカウントをお持ちの方はこちら",
    toSignup: "アカウントをお持ちでない方はこちら",
    checkEmail:
      "確認メールを送信しました。メール内のリンクをクリックして登録を完了してください。",
    notConfigured:
      "認証が未設定です（デモモード）。このまま利用できますが、登録情報は保存されません。",
    guestContinue: "登録せずに使ってみる",
    loggedInAs: "ログイン中",
    minPassword: "パスワードは6文字以上にしてください",
    invalidEmail: "メールアドレスの形式が正しくありません",
  },
  home: {
    beta: "オープンβ公開中",
    betaNote: "現在はAI道場が利用できます",
    ctaTitle: "AI道場で今すぐ腕試し",
    ctaDesc: "GPT-4oと1対1ディベート。無料プランは1日1回まで",
    ctaBtn: "対戦を始める",
    rooms: "公開ルーム",
    roomsEn: "PUBLIC ROOMS",
    roomsSoon: "リアルタイム対人対戦は準備中",
    roomsSoonNote: "まずはAI道場で腕を磨きましょう",
    news: "ニュース",
    newsEn: "NEWS FEED",
  },
  battle: {
    title: "モード選択",
    titleEn: "SELECT MODE",
    subtitle: "今日はどの流儀で鍛える？",
    aiTag: "SOLO / 1人プレイ",
    aiTitle: "AI道場",
    aiDesc:
      "GPT-4oベースのAIと1対1で対戦。テキスト／音声チャットでいつでも即スタート。",
    randomTag: "RANKED / ランダムマッチ",
    randomTitle: "オンライン対戦",
    randomDesc:
      "全国のユーザーとリアルタイム音声で対人戦。レーティングがかかる真剣勝負。",
    groupTag: "CUSTOM / フレンド対戦",
    groupTitle: "対人戦ルーム",
    groupDesc:
      "コードを共有して友達と1対1のリアルタイム議論。AIが両者を採点します。",
    themeBank: "テーマバンク",
    themeBankEn: "THEME BANK",
    countSuffix: "件",
    soon: "準備中",
  },
  versus: {
    title: "対人戦",
    lobbyTitle: "リアルタイム対人戦",
    lobbySub: "2人でコードを共有し、リアルタイムで議論してAI判定",
    nameLabel: "あなたの名前",
    namePh: "例: ロンくん",
    create: "部屋を作る",
    createDesc: "テーマを決めてコードを発行。あなたは肯定側です",
    join: "参加する",
    joinDesc: "友達のコードを入力して参加。あなたは否定側です",
    codeLabel: "参加コード",
    codePh: "6桁の数字",
    reroll: "テーマを変える",
    createBtn: "この部屋を作る",
    joinBtn: "参加する",
    needName: "名前を入力してください",
    needCode: "6桁のコードを入力してください",
    waiting: "相手の入室を待っています…",
    shareCode: "このコードを相手に共有してください",
    joined: "が入室しました",
    you: "あなた",
    pro: "肯定側",
    con: "否定側",
    placeholder: "主張・反論を入力（Enterで送信）",
    send: "送信",
    finish: "終了して採点",
    scoring: "AIが両者を採点中…",
    leave: "退出",
    resultTitle: "対戦結果",
    winnerSuffix: "の勝利",
    comment: "総評",
    good: "良かった点",
    improve: "改善点",
    again: "もう一度",
    backHome: "ホームへ戻る",
    opponentLeft: "相手が退出しました",
  },
  profile: {
    title: "プロフィール設定",
    sub: "対人戦などで他のユーザーに表示されることがあります",
    avatar: "アイコン画像",
    avatarPick: "写真を選ぶ",
    avatarChange: "変更する",
    avatarRemove: "削除",
    avatarUploading: "アップロード中…",
    avatarNote: "3MB以下の画像（正方形推奨）",
    name: "名前（表示名）",
    namePh: "例: ロンくん",
    age: "年齢",
    agePh: "例: 22",
    gender: "性別",
    field: "得意な分野",
    experience: "ディベート経験",
    bio: "自己紹介（一言）",
    bioPh: "例: 就活対策で始めました。よろしく！",
    save: "保存する",
    saving: "保存中…",
    saved: "保存しました",
    saveFail: "保存に失敗しました",
    unset: "未設定",
    loginNeeded: "プロフィール設定にはログインが必要です",
    login: "ログイン",
    genderOpts: {
      male: "男性",
      female: "女性",
      other: "その他",
      na: "回答しない",
    },
    fieldOpts: {
      careers: "就活",
      current: "時事",
      business: "ビジネス",
      academia: "学術",
      all: "オールラウンド",
    },
    expOpts: {
      beginner: "初心者",
      casual: "ときどき",
      experienced: "経験者",
    },
  },
  mypage: {
    plan: "FREE",
    guestNote: "ログインすると戦績が記録されます",
    stats: ["対戦数", "勝利", "勝率"],
    premiumTitle: "Premiumにアップグレード",
    features: [
      "AI対戦が無制限",
      "AI採点の詳細レポート・改善提案",
      "グループルーム作成が無制限",
      "広告非表示・過去ログ無制限保存",
    ],
    priceBtn: "月額 1,280円で始める",
    studentPlan: "学生プランは月額680円（要学生証認証）",
    history: "過去の対戦",
    historyEn: "BATTLE LOG",
    noHistory: "まだ対戦がありません",
    noHistoryNote: "AI道場で対戦するとここに記録されます",
    menu: ["アカウント設定", "通知設定", "ヘルプ・お問い合わせ"],
    logout: "ログアウト",
  },
  ai: {
    levelSelect: "相手のレベルを選択",
    levelSelectSub: "AIの議論スタイルが変わります",
    levels: {
      easy: "肩慣らし。AIは優しく議論に付き合い、反論の余地を残してくれる。",
      normal: "標準レベル。根拠のある反論が正面から返ってくる。",
      hard: "全国大会レベル。論理の飛躍や根拠の曖昧さを複数論点で執拗に突かれる。",
      oni: "無敗の論破王。全ての穴を突かれ、再反論も先回りで潰される。覚悟せよ。",
    },
    sideSelect: "立場を選択",
    sideSelectSub: "肯定側が先攻で立論します。否定側を選ぶとAIが先に立論します",
    proDesc: "先攻。あなたの立論から試合が始まる",
    conDesc: "後攻。AIの立論への反駁から入る",
    roulette: "🎲 ルーレットで決める",
    spinning: "運命が決めています…",
    rouletteNote: "本番のグループ戦ではランダムに振り分けられます",
    finishBtn: "終了して採点",
    judging: "採点中…",
    selectingTheme: "テーマを選定中…",
    you: "あなた",
    thinking: "反論を構築中…",
    analyzing: "AIが対戦ログを4軸で解析中…",
    placeholder: "主張・反論を入力（Enterで送信）",
    connecting: "接続中…",
    send: "送信",
    turnsPre: "発言",
    turnsPost: "回 — 3回以上の応酬で採点精度が上がります",
  },
  room: {
    phases: [
      "準備",
      "立論・肯定側",
      "立論・否定側",
      "作戦タイム",
      "反駁・肯定側",
      "反駁・否定側",
      "最終弁論・肯定側",
      "最終弁論・否定側",
      "AI採点",
    ],
    steps: ["準備", "立論", "作戦", "反駁", "最終弁論", "採点"],
    theme: "日本は救急車を有料化すべきか",
    category: "時事",
    skip: "スキップ",
    strategyBanner: "作戦タイム中 — チーム内通話のみ可能です",
    aiBanner: "AIが対戦ログを解析中…",
    judge: "ジャッジ:",
    speaking: "発話中",
    viewResult: "採点結果を見る",
    memo: "メモ",
    memoEn: "TACTICAL NOTE",
    memoPlaceholder: "相手の主張の弱点、反駁の要点などをメモ…",
    close: "閉じる",
    micOn: "マイクON",
    muted: "ミュート中",
    leave: "退出",
    players: { misaki: "ミサキ", kenta: "ケンタ", yuta: "ユウタ", aoi: "アオイ" },
  },
  result: {
    title: "採点結果",
    level: "難易度:",
    demo: "— サンプル表示（対戦データなし） —",
    loading: "LOADING RESULT…",
    winPre: "WIN — あなた（",
    winPost: "）の勝利",
    losePre: "LOSE — あなた（",
    losePost: "）の敗北",
    totalLabel: "TOTAL SCORE / 総合スコア",
    good: "良かった点",
    improve: "改善点",
    summary: "総評",
    premiumNote:
      "なら、フェーズ別の詳細レポートと改善提案・全文文字起こしが見られます",
    detail: "詳細",
    again: "もう一度対戦する",
    backHome: "ホームへ戻る",
    axes: {
      logic: "論理性",
      persuasion: "説得力",
      rebuttal: "反論力",
      structure: "構成力",
    },
  },
  data: {
    rooms: [
      {
        id: "r1",
        category: "時事",
        cls: "border-accent/40 bg-accent-soft text-accent",
        theme: "日本は救急車を有料化すべきか",
        members: 5,
        capacity: 8,
        live: false,
      },
      {
        id: "r2",
        category: "就活",
        cls: "border-green/40 bg-green-soft text-green",
        theme: "新卒一括採用は廃止すべきか",
        members: 8,
        capacity: 8,
        live: true,
      },
      {
        id: "r3",
        category: "ビジネス",
        cls: "border-blue/40 bg-blue-soft text-blue",
        theme: "リモートワークを標準とすべきか",
        members: 3,
        capacity: 6,
        live: false,
      },
      {
        id: "r4",
        category: "学術",
        cls: "border-purple/40 bg-purple-soft text-purple",
        theme: "AIに著作権を認めるべきか",
        members: 6,
        capacity: 8,
        live: true,
      },
    ],
    news: [
      {
        id: "n1",
        date: "7/21",
        title: "RONPAをオープンβとして公開しました",
      },
      {
        id: "n2",
        date: "7/21",
        title: "AI道場（GPT-4oによる採点）が利用できます",
      },
    ],
    themeBank: [
      {
        category: "就活",
        cls: "border-green/40 bg-green-soft text-green",
        count: 42,
        sample: "新卒一括採用は廃止すべきか",
      },
      {
        category: "時事",
        cls: "border-accent/40 bg-accent-soft text-accent",
        count: 58,
        sample: "日本は救急車を有料化すべきか",
      },
      {
        category: "ビジネス",
        cls: "border-blue/40 bg-blue-soft text-blue",
        count: 35,
        sample: "副業は全面解禁すべきか",
      },
      {
        category: "学術",
        cls: "border-purple/40 bg-purple-soft text-purple",
        count: 27,
        sample: "AIに著作権を認めるべきか",
      },
    ],
    history: [
      {
        id: "m1",
        date: "7/16",
        theme: "日本は救急車を有料化すべきか",
        side: "肯定" as const,
        win: true,
        score: 32,
      },
      {
        id: "m2",
        date: "7/14",
        theme: "レジ袋の有料化は継続すべきか",
        side: "否定" as const,
        win: false,
        score: 27,
      },
      {
        id: "m3",
        date: "7/12",
        theme: "週休3日制を導入すべきか",
        side: "肯定" as const,
        win: true,
        score: 30,
      },
    ],
    sample: {
      theme: "日本は救急車を有料化すべきか",
      side: "肯定" as const,
      total: 32,
      axes: { logic: 8, persuasion: 7, rebuttal: 9, structure: 8 },
      good: "反駁フェーズで相手の統計データの出典の曖昧さを的確に突けていた点は高評価。立論での「軽症利用の抑制」という論点設定も、テーマの核心を捉えている。",
      improve:
        "最終弁論の結論が立論の繰り返しに終始しており、新しい説得材料がない。また「〜と思います」が多用され断定を避ける癖があり、説得力を自ら下げている。数値根拠は2件のみで、主張の割に証拠が薄い。",
      summary:
        "総合的には堅実な試合運びだが、勝敗を分けたのは相手の失点であり、自力で崩したとは言い難い。次戦は反駁で得た優位を最終弁論に接続する「流れの設計」を課題とすること。",
    },
  },
};

const en: typeof ja = {
  nav: { home: "Home", battle: "Battle", mypage: "My Page" },
  side: { 肯定: "Pro", 否定: "Con" },
  levels: { easy: "Easy", normal: "Normal", hard: "Hard", oni: "Oni" },
  splash: {
    catch1: "Japan-born realtime debate arena × AI judging",
    catch2: "A dojo to train logic and persuasion through real practice",
    signup: "Sign up & start",
    login: "Log in",
    terms: "By signing up, you agree to our Terms of Service and Privacy Policy",
    termsLabel: "Terms of Service",
    privacyLabel: "Privacy Policy",
  },
  auth: {
    signupTitle: "Sign up",
    loginTitle: "Log in",
    signupSub: "Register with your email and a password",
    loginSub: "Log in with your existing account",
    email: "Email",
    emailPh: "you@example.com",
    password: "Password",
    passwordPh: "6+ characters",
    signupBtn: "Sign up",
    loginBtn: "Log in",
    processing: "Processing…",
    toLogin: "Already have an account? Log in",
    toSignup: "Don't have an account? Sign up",
    checkEmail:
      "Confirmation email sent. Click the link in the email to finish signing up.",
    notConfigured:
      "Auth is not configured (demo mode). You can still use the app, but your account won't be saved.",
    guestContinue: "Continue without signing up",
    loggedInAs: "Signed in",
    minPassword: "Password must be at least 6 characters",
    invalidEmail: "Invalid email format",
  },
  home: {
    beta: "Open Beta",
    betaNote: "The AI Dojo is available now",
    ctaTitle: "Test your skills in the AI Dojo",
    ctaDesc: "1-on-1 debate with GPT-4o. Free plan: once per day",
    ctaBtn: "Start battle",
    rooms: "Public Rooms",
    roomsEn: "公開ルーム",
    roomsSoon: "Real-time human battles coming soon",
    roomsSoonNote: "For now, sharpen your skills in the AI Dojo",
    news: "News",
    newsEn: "ニュース",
  },
  battle: {
    title: "Select Mode",
    titleEn: "モード選択",
    subtitle: "Which style will you train today?",
    aiTag: "SOLO / Single player",
    aiTitle: "AI Dojo",
    aiDesc:
      "1-on-1 against a GPT-4o opponent. Text or voice chat, start anytime.",
    randomTag: "RANKED / Random match",
    randomTitle: "Online Battle",
    randomDesc:
      "Realtime voice battles against users nationwide. Rating on the line.",
    groupTag: "CUSTOM / Friend battle",
    groupTitle: "Versus Room",
    groupDesc:
      "Share a code for a 1-on-1 realtime debate with a friend. AI judges both sides.",
    themeBank: "Theme Bank",
    themeBankEn: "テーマバンク",
    countSuffix: "",
    soon: "Coming soon",
  },
  versus: {
    title: "Versus",
    lobbyTitle: "Realtime Versus",
    lobbySub: "Share a code with a friend, debate live, and get AI judging",
    nameLabel: "Your name",
    namePh: "e.g. Ron",
    create: "Create room",
    createDesc: "Pick a topic and issue a code. You are the Pro side",
    join: "Join",
    joinDesc: "Enter a friend's code to join. You are the Con side",
    codeLabel: "Room code",
    codePh: "6 digits",
    reroll: "Change topic",
    createBtn: "Create this room",
    joinBtn: "Join",
    needName: "Please enter your name",
    needCode: "Please enter the 6-digit code",
    waiting: "Waiting for your opponent…",
    shareCode: "Share this code with your opponent",
    joined: "joined",
    you: "You",
    pro: "Pro",
    con: "Con",
    placeholder: "Type your argument (Enter to send)",
    send: "Send",
    finish: "Finish & judge",
    scoring: "AI is judging both sides…",
    leave: "Leave",
    resultTitle: "Result",
    winnerSuffix: " wins",
    comment: "Overall",
    good: "Strengths",
    improve: "To improve",
    again: "Again",
    backHome: "Back to home",
    opponentLeft: "Your opponent left",
  },
  profile: {
    title: "Profile settings",
    sub: "May be shown to others in versus matches",
    avatar: "Profile photo",
    avatarPick: "Choose photo",
    avatarChange: "Change",
    avatarRemove: "Remove",
    avatarUploading: "Uploading…",
    avatarNote: "Image under 3MB (square recommended)",
    name: "Display name",
    namePh: "e.g. Ron",
    age: "Age",
    agePh: "e.g. 22",
    gender: "Gender",
    field: "Strong field",
    experience: "Debate experience",
    bio: "Bio (one line)",
    bioPh: "e.g. Started for job hunting. Nice to meet you!",
    save: "Save",
    saving: "Saving…",
    saved: "Saved",
    saveFail: "Failed to save",
    unset: "Not set",
    loginNeeded: "Log in to edit your profile",
    login: "Log in",
    genderOpts: {
      male: "Male",
      female: "Female",
      other: "Other",
      na: "Prefer not to say",
    },
    fieldOpts: {
      careers: "Careers",
      current: "Current affairs",
      business: "Business",
      academia: "Academia",
      all: "All-round",
    },
    expOpts: {
      beginner: "Beginner",
      casual: "Casual",
      experienced: "Experienced",
    },
  },
  mypage: {
    plan: "FREE",
    guestNote: "Log in to save your record",
    stats: ["Battles", "Wins", "Win rate"],
    premiumTitle: "Upgrade to Premium",
    features: [
      "Unlimited AI battles",
      "Detailed AI reports & improvement tips",
      "Unlimited group room creation",
      "Ad-free & unlimited battle log storage",
    ],
    priceBtn: "Start for ¥1,280/mo",
    studentPlan: "Student plan: ¥680/mo (student ID required)",
    history: "Battle Log",
    historyEn: "過去の対戦",
    noHistory: "No battles yet",
    noHistoryNote: "Your matches in the AI Dojo will appear here",
    menu: ["Account settings", "Notifications", "Help & support"],
    logout: "Log out",
  },
  ai: {
    levelSelect: "Choose your opponent's level",
    levelSelectSub: "Changes the AI's debating style",
    levels: {
      easy: "Warm-up. The AI debates gently and leaves openings for you.",
      normal: "Standard level. Well-grounded rebuttals come straight at you.",
      hard: "National-tournament level. Relentless attacks on every weak point.",
      oni: "The undefeated champion. Every hole exposed, every comeback crushed.",
    },
    sideSelect: "Choose your side",
    sideSelectSub: "Pro speaks first. Choose Con and the AI opens the debate",
    proDesc: "First speaker. The match starts with your argument",
    conDesc: "Second speaker. You start by rebutting the AI's argument",
    roulette: "🎲 Spin the roulette",
    spinning: "Fate is deciding…",
    rouletteNote: "In real group battles, sides are assigned randomly",
    finishBtn: "Finish & judge",
    judging: "Judging…",
    selectingTheme: "Selecting topic…",
    you: "You",
    thinking: "Composing rebuttal…",
    analyzing: "AI is analyzing the debate on 4 axes…",
    placeholder: "Type your argument (Enter to send)",
    connecting: "Connecting…",
    send: "Send",
    turnsPre: "Turns:",
    turnsPost: " — 3+ exchanges improve judging accuracy",
  },
  room: {
    phases: [
      "Prep",
      "Opening – Pro",
      "Opening – Con",
      "Strategy",
      "Rebuttal – Pro",
      "Rebuttal – Con",
      "Closing – Pro",
      "Closing – Con",
      "AI Judging",
    ],
    steps: ["Prep", "Opening", "Strategy", "Rebuttal", "Closing", "Judge"],
    theme: "Should ambulance services charge a fee?",
    category: "Current Affairs",
    skip: "Skip",
    strategyBanner: "Strategy time — team-only voice channel",
    aiBanner: "AI is analyzing the debate log…",
    judge: "Judge:",
    speaking: "Speaking",
    viewResult: "View results",
    memo: "Note",
    memoEn: "TACTICAL NOTE",
    memoPlaceholder: "Note weaknesses in their argument, rebuttal points…",
    close: "Close",
    micOn: "Mic ON",
    muted: "Muted",
    leave: "Leave",
    players: { misaki: "Misaki", kenta: "Kenta", yuta: "Yuta", aoi: "Aoi" },
  },
  result: {
    title: "Results",
    level: "Level:",
    demo: "— Sample data (no battle record) —",
    loading: "LOADING RESULT…",
    winPre: "WIN — You (",
    winPost: ") won",
    losePre: "LOSE — You (",
    losePost: ") lost",
    totalLabel: "TOTAL SCORE",
    good: "Strengths",
    improve: "To improve",
    summary: "Overall",
    premiumNote:
      " unlocks per-phase detailed reports, improvement tips, and full transcripts",
    detail: "More",
    again: "Battle again",
    backHome: "Back to home",
    axes: {
      logic: "Logic",
      persuasion: "Persuasion",
      rebuttal: "Rebuttal",
      structure: "Structure",
    },
  },
  data: {
    rooms: [
      {
        id: "r1",
        category: "Current Affairs",
        cls: "border-accent/40 bg-accent-soft text-accent",
        theme: "Should ambulance services charge a fee?",
        members: 5,
        capacity: 8,
        live: false,
      },
      {
        id: "r2",
        category: "Careers",
        cls: "border-green/40 bg-green-soft text-green",
        theme: "Should mass hiring of new graduates be abolished?",
        members: 8,
        capacity: 8,
        live: true,
      },
      {
        id: "r3",
        category: "Business",
        cls: "border-blue/40 bg-blue-soft text-blue",
        theme: "Should remote work become the standard?",
        members: 3,
        capacity: 6,
        live: false,
      },
      {
        id: "r4",
        category: "Academia",
        cls: "border-purple/40 bg-purple-soft text-purple",
        theme: "Should AI-generated works be granted copyright?",
        members: 6,
        capacity: 8,
        live: true,
      },
    ],
    news: [
      {
        id: "n1",
        date: "7/21",
        title: "RONPA is now live as an open beta",
      },
      {
        id: "n2",
        date: "7/21",
        title: "The AI Dojo (scoring by GPT-4o) is available",
      },
    ],
    themeBank: [
      {
        category: "Careers",
        cls: "border-green/40 bg-green-soft text-green",
        count: 42,
        sample: "Should mass hiring of new graduates be abolished?",
      },
      {
        category: "Current Affairs",
        cls: "border-accent/40 bg-accent-soft text-accent",
        count: 58,
        sample: "Should ambulance services charge a fee?",
      },
      {
        category: "Business",
        cls: "border-blue/40 bg-blue-soft text-blue",
        count: 35,
        sample: "Should side jobs be fully liberalized?",
      },
      {
        category: "Academia",
        cls: "border-purple/40 bg-purple-soft text-purple",
        count: 27,
        sample: "Should AI-generated works be granted copyright?",
      },
    ],
    history: [
      {
        id: "m1",
        date: "7/16",
        theme: "Should ambulance services charge a fee?",
        side: "肯定" as const,
        win: true,
        score: 32,
      },
      {
        id: "m2",
        date: "7/14",
        theme: "Should plastic bag fees be continued?",
        side: "否定" as const,
        win: false,
        score: 27,
      },
      {
        id: "m3",
        date: "7/12",
        theme: "Should companies adopt a four-day workweek?",
        side: "肯定" as const,
        win: true,
        score: 30,
      },
    ],
    sample: {
      theme: "Should ambulance services charge a fee?",
      side: "肯定" as const,
      total: 32,
      axes: { logic: 8, persuasion: 7, rebuttal: 9, structure: 8 },
      good: "Sharp attack on the vague sourcing of the opponent's statistics during rebuttal. Framing the debate around curbing non-urgent use hit the core of the topic.",
      improve:
        "Your closing merely repeated the opening with no new persuasive material. Frequent hedging weakened your delivery, and only two numerical facts backed a large claim.",
      summary:
        "A solid match overall, but the win came from the opponent's mistakes rather than your own decisive play. Next time, design the flow so your rebuttal advantage carries into the closing.",
    },
  },
};

export const translations = { ja, en };
export type Dict = typeof ja;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}>({ lang: "ja", setLang: () => {}, t: ja });

const LANG_CHANGE_EVENT = "ronpa:language-change";

function subscribeToLang(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LANG_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LANG_CHANGE_EVENT, onChange);
  };
}

function serverLang(): Lang {
  return "ja";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeToLang, currentLang, serverLang);
  const setLang = (l: Lang) => {
    localStorage.setItem(STORAGE_KEY, l);
    window.dispatchEvent(new Event(LANG_CHANGE_EVENT));
  };
  return (
    <LangContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

/** Provider のハイドレーションを待たずに現在の言語を取得する（クライアント専用） */
export function currentLang(): Lang {
  if (typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "en") {
    return "en";
  }
  return "ja";
}

export function LangToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLang();
  return (
    <div
      className={`flex overflow-hidden rounded-full border border-line bg-surface/80 text-[10px] font-bold ${className}`}
    >
      {(["ja", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 ${
            lang === l ? "bg-cyan text-[#02131a]" : "text-ink-3 hover:text-ink"
          }`}
        >
          {l === "ja" ? "JP" : "EN"}
        </button>
      ))}
    </div>
  );
}
