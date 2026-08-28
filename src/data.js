export const ASSET_BASE = 'https://tt-sensei.github.io/navi-character-/assets/web/fantasy';
export const BADGE_BASE = 'https://tt-sensei.github.io/edu-assets/assets/web';

export const CHARACTERS = [
  { id:'sora', name:'そら', job:'剣士', stand:'sora-swordsman.webp', action:'sora-swordsman' },
  { id:'riku', name:'りく', job:'忍者', stand:'riku-ninja.webp', action:'riku-ninja' },
  { id:'kai', name:'かい', job:'魔導士', stand:'kai-mage.webp', action:'kai-mage' },
  { id:'tsuki', name:'つき', job:'アーチャー', stand:'tsuki-archer.webp', action:'tsuki-archer' },
  { id:'nami', name:'なみ', job:'守護騎士', stand:'nami-guardian-knight.webp', action:'nami-knight' },
  { id:'saku', name:'さく', job:'僧侶', stand:'saku-cleric-healer.webp', action:'saku-cleric' }
];

// 2025年12月22日 内閣告示第4号の本表を表示形の基準にする。
// accepts はPC入力として受け付ける別つづり。表示用と判定用を分離している。
export const ROMAJI = {
  'あ':{show:'a', accepts:['a']}, 'い':{show:'i', accepts:['i']}, 'う':{show:'u', accepts:['u']}, 'え':{show:'e', accepts:['e']}, 'お':{show:'o', accepts:['o']},
  'か':{show:'ka', accepts:['ka']}, 'き':{show:'ki', accepts:['ki']}, 'く':{show:'ku', accepts:['ku','cu','qu']}, 'け':{show:'ke', accepts:['ke']}, 'こ':{show:'ko', accepts:['ko','co']},
  'さ':{show:'sa', accepts:['sa']}, 'し':{show:'shi', accepts:['shi','si','ci']}, 'す':{show:'su', accepts:['su']}, 'せ':{show:'se', accepts:['se','ce']}, 'そ':{show:'so', accepts:['so']},
  'た':{show:'ta', accepts:['ta']}, 'ち':{show:'chi', accepts:['chi','ti']}, 'つ':{show:'tsu', accepts:['tsu','tu']}, 'て':{show:'te', accepts:['te']}, 'と':{show:'to', accepts:['to']},
  'な':{show:'na', accepts:['na']}, 'に':{show:'ni', accepts:['ni']}, 'ぬ':{show:'nu', accepts:['nu']}, 'ね':{show:'ne', accepts:['ne']}, 'の':{show:'no', accepts:['no']},
  'は':{show:'ha', accepts:['ha']}, 'ひ':{show:'hi', accepts:['hi']}, 'ふ':{show:'fu', accepts:['fu','hu']}, 'へ':{show:'he', accepts:['he']}, 'ほ':{show:'ho', accepts:['ho']},
  'ま':{show:'ma', accepts:['ma']}, 'み':{show:'mi', accepts:['mi']}, 'む':{show:'mu', accepts:['mu']}, 'め':{show:'me', accepts:['me']}, 'も':{show:'mo', accepts:['mo']},
  'や':{show:'ya', accepts:['ya']}, 'ゆ':{show:'yu', accepts:['yu']}, 'よ':{show:'yo', accepts:['yo']},
  'ら':{show:'ra', accepts:['ra']}, 'り':{show:'ri', accepts:['ri']}, 'る':{show:'ru', accepts:['ru']}, 'れ':{show:'re', accepts:['re']}, 'ろ':{show:'ro', accepts:['ro']},
  'わ':{show:'wa', accepts:['wa']}, 'を':{show:'o', accepts:['o','wo']}, 'ん':{show:'n', accepts:['n','nn']},
  'が':{show:'ga', accepts:['ga']}, 'ぎ':{show:'gi', accepts:['gi']}, 'ぐ':{show:'gu', accepts:['gu']}, 'げ':{show:'ge', accepts:['ge']}, 'ご':{show:'go', accepts:['go']},
  'ざ':{show:'za', accepts:['za']}, 'じ':{show:'ji', accepts:['ji','zi']}, 'ず':{show:'zu', accepts:['zu']}, 'ぜ':{show:'ze', accepts:['ze']}, 'ぞ':{show:'zo', accepts:['zo']},
  'だ':{show:'da', accepts:['da']}, 'ぢ':{show:'ji', accepts:['ji','zi','di']}, 'づ':{show:'zu', accepts:['zu','du']}, 'で':{show:'de', accepts:['de']}, 'ど':{show:'do', accepts:['do']},
  'ば':{show:'ba', accepts:['ba']}, 'び':{show:'bi', accepts:['bi']}, 'ぶ':{show:'bu', accepts:['bu']}, 'べ':{show:'be', accepts:['be']}, 'ぼ':{show:'bo', accepts:['bo']},
  'ぱ':{show:'pa', accepts:['pa']}, 'ぴ':{show:'pi', accepts:['pi']}, 'ぷ':{show:'pu', accepts:['pu']}, 'ぺ':{show:'pe', accepts:['pe']}, 'ぽ':{show:'po', accepts:['po']},
  'きゃ':{show:'kya', accepts:['kya']}, 'きゅ':{show:'kyu', accepts:['kyu']}, 'きょ':{show:'kyo', accepts:['kyo']},
  'しゃ':{show:'sha', accepts:['sha','sya']}, 'しゅ':{show:'shu', accepts:['shu','syu']}, 'しょ':{show:'sho', accepts:['sho','syo']},
  'ちゃ':{show:'cha', accepts:['cha','tya','cya']}, 'ちゅ':{show:'chu', accepts:['chu','tyu','cyu']}, 'ちょ':{show:'cho', accepts:['cho','tyo','cyo']},
  'にゃ':{show:'nya', accepts:['nya']}, 'にゅ':{show:'nyu', accepts:['nyu']}, 'にょ':{show:'nyo', accepts:['nyo']},
  'ひゃ':{show:'hya', accepts:['hya']}, 'ひゅ':{show:'hyu', accepts:['hyu']}, 'ひょ':{show:'hyo', accepts:['hyo']},
  'みゃ':{show:'mya', accepts:['mya']}, 'みゅ':{show:'myu', accepts:['myu']}, 'みょ':{show:'myo', accepts:['myo']},
  'りゃ':{show:'rya', accepts:['rya']}, 'りゅ':{show:'ryu', accepts:['ryu']}, 'りょ':{show:'ryo', accepts:['ryo']},
  'ぎゃ':{show:'gya', accepts:['gya']}, 'ぎゅ':{show:'gyu', accepts:['gyu']}, 'ぎょ':{show:'gyo', accepts:['gyo']},
  'じゃ':{show:'ja', accepts:['ja','jya','zya']}, 'じゅ':{show:'ju', accepts:['ju','jyu','zyu']}, 'じょ':{show:'jo', accepts:['jo','jyo','zyo']},
  'びゃ':{show:'bya', accepts:['bya']}, 'びゅ':{show:'byu', accepts:['byu']}, 'びょ':{show:'byo', accepts:['byo']},
  'ぴゃ':{show:'pya', accepts:['pya']}, 'ぴゅ':{show:'pyu', accepts:['pyu']}, 'ぴょ':{show:'pyo', accepts:['pyo']}
};

export const KANA_RANGES = {
  vowels:['あ','い','う','え','お'],
  kToN:['か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と','な','に','ぬ','ね','の'],
  hToW:['は','ひ','ふ','へ','ほ','ま','み','む','め','も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を'],
  voiced:['が','ぎ','ぐ','げ','ご','ざ','じ','ず','ぜ','ぞ','だ','ぢ','づ','で','ど','ば','び','ぶ','べ','ぼ','ぱ','ぴ','ぷ','ぺ','ぽ'],
  small:['きゃ','きゅ','きょ','しゃ','しゅ','しょ','ちゃ','ちゅ','ちょ','にゃ','にゅ','にょ','ひゃ','ひゅ','ひょ','みゃ','みゅ','みょ','りゃ','りゅ','りょ','ぎゃ','ぎゅ','ぎょ','じゃ','じゅ','じょ','びゃ','びゅ','びょ','ぴゃ','ぴゅ','ぴょ','ん','きって','ざっし','がっこう']
};

export const WORDS = [
  {kana:'ねこ', level:'easy'}, {kana:'いぬ', level:'easy'}, {kana:'すし', level:'easy'}, {kana:'そら', level:'easy'},
  {kana:'うみ', level:'easy'}, {kana:'やま', level:'easy'}, {kana:'かさ', level:'easy'}, {kana:'ほし', level:'easy'},
  {kana:'みず', level:'easy'}, {kana:'くも', level:'easy'}, {kana:'はな', level:'easy'}, {kana:'たこ', level:'easy'},
  {kana:'くるま', level:'normal'}, {kana:'たぬき', level:'normal'}, {kana:'でんしゃ', level:'normal'}, {kana:'さかな', level:'normal'},
  {kana:'ともだち', level:'normal'}, {kana:'ひまわり', level:'normal'}, {kana:'かがみ', level:'normal'}, {kana:'じてんしゃ', level:'normal'},
  {kana:'きつね', level:'normal'}, {kana:'しんぶん', level:'normal'}, {kana:'りんご', level:'normal'}, {kana:'にわとり', level:'normal'},
  {kana:'きって', level:'hard'}, {kana:'がっこう', level:'hard'}, {kana:'きょうしつ', level:'hard'}, {kana:'しゃしん', level:'hard'},
  {kana:'ざっし', level:'hard'}, {kana:'ちょきん', level:'hard'}, {kana:'りょこう', level:'hard'}, {kana:'きゅうしょく', level:'hard'},
  {kana:'ちょうちょ', level:'hard'}, {kana:'はっぴょう', level:'hard'}, {kana:'しゅくだい', level:'hard'}, {kana:'じゃんけん', level:'hard'}
];

const BADGE_IMAGES = [
  'badges/common/first-step','badges/common/clear','badges/common/combo','badges/common/speed','badges/common/accuracy',
  'badges/common/challenger','badges/common/keep-going','badges/common/comeback','badges/common/growth','badges/common/mastery',
  'badges/common/practice-master','badges/common/review-master','badges/common/new-skill','badges/common/never-give-up','badges/common/new-skill',
  'badges/japanese/language-rhythm','badges/japanese/word-sprout','badges/japanese/word-tree','badges/japanese/word-weaver','badges/japanese/words-connect',
  'collections/fantasy/common/dragon','collections/fantasy/common/fairy','collections/fantasy/common/golem','collections/fantasy/common/griffin','collections/fantasy/common/phoenix'
];

const specials = [
  ['first-battle','はじめの一歩','初めてバトルを終える','plays',1],
  ['kana-clear','かなの剣','かなバトルを終える','mode:kana',1],
  ['word-clear','ことばの連撃','ことばバトルを終える','mode:word',1],
  ['master-clear','思い出す力','マスターバトルを終える','mode:master',1],
  ['combo-10','10コンボ','最大10コンボを達成','combo',10],
  ['combo-20','20コンボ','最大20コンボを達成','combo',20],
  ['no-damage','鉄壁','ノーダメージで終える','noDamage',1],
  ['retry-clear','学び直しの星','ヒント後に自力で克服','retryClear',1],
  ['sokuon-10','つまる音名人','促音を10回成功','sokuon',10],
  ['youon-10','小さいやゆよ名人','拗音を10回成功','youon',10],
  ['record','記録更新','ハイスコアを更新','records',1]
];

export const BADGES = [
  ...specials.map((b,i)=>({id:b[0],name:b[1],desc:b[2],metric:b[3],need:b[4],image:`${BADGE_BASE}/${BADGE_IMAGES[i% BADGE_IMAGES.length]}/badge.webp`})),
  ...Array.from({length:139},(_,i)=>{
    const need=(i+1)*100;
    return {id:`keys-${need}`,name:`${need}キーの足あと`,desc:`正しい入力を累計${need}キー`,metric:'totalKeys',need,image:`${BADGE_BASE}/${BADGE_IMAGES[(i+11)%BADGE_IMAGES.length]}/badge.webp`};
  })
];

export const MODE_INFO = {
  kana:{name:'かなバトル',desc:'ローマ字を見ながら文字を打とう'},
  word:{name:'ことばバトル',desc:'ローマ字を見ながら言葉を打とう'},
  master:{name:'マスターバトル',desc:'ローマ字を見ないで挑戦！'}
};
