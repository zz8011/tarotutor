export type TarotDeck = 'eastern' | 'chinese-ink';

export interface TarotDeckGuide {
  id: TarotDeck;
  label: string;
  visualGuide: string;
  interpretationRule: string;
}

export const tarotDeckGuides: Record<TarotDeck, TarotDeckGuide> = {
  eastern: {
    id: 'eastern',
    label: '东方秘语塔罗',
    visualGuide:
      '这一套牌强调东方神秘气质、华丽纹样、柔和光影与仪式感。回答时先抓住人物姿态、器物、空间关系和氛围，再把画面转成牌义，不要只背通用韦特术语。若牌面里有明显的金色、饰纹、神话气息或层次丰富的背景，就优先围绕这些元素展开。',
    interpretationRule:
      '若当前图像的细节和标准韦特记忆有差异，以当前画面为准；不要把另一套牌的标志性元素硬套过来。用户已经说出的观察优先级最高，导师应围绕用户看到的画面补充，而不是推翻它。',
  },
  'chinese-ink': {
    id: 'chinese-ink',
    label: '水墨塔罗',
    visualGuide:
      '这一套牌强调水墨、留白、线条、层次和东方意境。回答时优先描述墨色、构图、服饰、道具、题字、印章和画面留白，再解释它们对应的含义。若牌面里出现山水、飞鸟、楼阁、云气或手绘笔触，就优先围绕这些元素展开，而不是讲西式华丽装饰。',
    interpretationRule:
      '尽量用当前图像里能看见的元素来解读，不要只复述通用牌义；如果细节更克制，就用更含蓄的语言表达。用户已经说出的观察优先级最高，导师应围绕用户看到的画面补充，而不是推翻它。',
  },
};

export function getTarotDeckGuide(deck: TarotDeck): TarotDeckGuide {
  return tarotDeckGuides[deck];
}
