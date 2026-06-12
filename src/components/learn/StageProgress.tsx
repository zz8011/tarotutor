import type { StudyStage } from '../../types';

export interface StageProgressProps {
  stage: StudyStage;
  stageOrder: StudyStage[];
  stageLabels: Record<StudyStage, string>;
  dueReviewCount: number;
}

export default function StageProgress({ stage, stageOrder, stageLabels, dueReviewCount }: StageProgressProps) {
  const progressIndex = Math.max(stageOrder.indexOf(stage), 0);

  return (
    <div className="stage-track-wrapper">
      <div className="stage-track" aria-label="学习阶段">
        {stageOrder.map((item, index) => (
          <span
            key={item}
            className={`stage-dot ${stage === item ? 'active' : ''} ${index < progressIndex ? 'done' : ''}`}
            title={stageLabels[item]}
          />
        ))}
      </div>
      <div className="study-meta">
        <span>{stageLabels[stage]}</span>
        <span>待复习 {dueReviewCount}</span>
        <span>本地已保存</span>
      </div>
    </div>
  );
}
