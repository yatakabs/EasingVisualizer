export type PreviewType = 'led' | 'graph' | 'camera' | 'value'

export interface PreviewConfig {
  id: PreviewType
  label: string
  description: string
}

export const PREVIEW_CONFIGS: PreviewConfig[] = [
  {
    id: 'led',
    label: 'LED',
    description: 'LED発光パネル'
  },
  {
    id: 'graph',
    label: 'グラフ',
    description: '2Dグラフ表示'
  },
  {
    id: 'camera',
    label: 'カメラ',
    description: '3Dカメラビュー'
  },
  {
    id: 'value',
    label: '値',
    description: '入力値と出力値の表示'
  }
]
