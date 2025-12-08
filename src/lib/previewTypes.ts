export type PreviewType = 'glow' | 'graph' | 'camera' | 'value'

export interface PreviewConfig {
  id: PreviewType
  label: string
  description: string
}

export const PREVIEW_CONFIGS: PreviewConfig[] = [
  {
    id: 'glow',
    label: 'Glow',
    description: '光度プレビュー'
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
