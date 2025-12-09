import { memo } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Play, Pause, Plus, GearSix, EyeSlash } from '@phosphor-icons/react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { toast } from 'sonner'
import { type EaseType } from '@/lib/easeTypes'
import { type PreviewType } from '@/lib/previewTypes'

interface ControlPanelProps {
  isPlaying: boolean
  speed: number
  gamma: number
  fps: number
  enabledPreviews: PreviewType[]
  enabledFilters: string[]
  inputValue: number
  baseInputValue: number
  manualInputMode: boolean
  triangularWaveMode: boolean
  cameraStartPos: { x: number; y: number; z: number }
  cameraEndPos: { x: number; y: number; z: number }
  cameraAspectRatio: string
  maxCameraPreviews: number
  cardScale: number
  endPauseDuration: number
  onPlayPause: () => void
  onSpeedChange: (speed: number) => void
  onGammaChange: (gamma: number) => void
  onAddPanel: () => void
  onTogglePreview: (previewType: PreviewType) => void
  onToggleFilter: (filterId: string) => void
  onInputValueChange: (value: number) => void
  onManualInputModeChange: (enabled: boolean) => void
  onTriangularWaveModeChange: (enabled: boolean) => void
  onSetAllEaseType?: (easeType: EaseType) => void
  onCameraStartPosChange: (pos: { x: number; y: number; z: number }) => void
  onCameraEndPosChange: (pos: { x: number; y: number; z: number }) => void
  onCameraAspectRatioChange: (aspectRatio: string) => void
  onMaxCameraPreviewsChange: (max: number) => void
  onCardScaleChange: (scale: number) => void
  onEndPauseDurationChange: (duration: number) => void
  coordinateSystem: 'left-handed' | 'right-handed'
  onCoordinateSystemChange: (system: 'left-handed' | 'right-handed') => void
  onHideControlPanel?: () => void
}

export const ControlPanel = memo(function ControlPanel({
  isPlaying,
  speed,
  gamma,
  fps,
  enabledPreviews,
  enabledFilters,
  inputValue,
  baseInputValue,
  manualInputMode,
  triangularWaveMode,
  cameraStartPos,
  cameraEndPos,
  cameraAspectRatio,
  maxCameraPreviews,
  cardScale,
  endPauseDuration,
  onPlayPause,
  onSpeedChange,
  onGammaChange,
  onAddPanel,
  onTogglePreview,
  onToggleFilter,
  onInputValueChange,
  onManualInputModeChange,
  onTriangularWaveModeChange,
  onSetAllEaseType,
  onCameraStartPosChange,
  onCameraEndPosChange,
  onCameraAspectRatioChange,
  onMaxCameraPreviewsChange,
  onCardScaleChange,
  onEndPauseDurationChange,
  coordinateSystem,
  onCoordinateSystemChange,
  onHideControlPanel
}: ControlPanelProps) {
  return (
    <div className="w-full bg-card border border-border rounded-lg p-3 sm:p-4 space-y-3">
      {/* ============================================= */}
      {/* 基本設定（常に表示） */}
      {/* ============================================= */}
      
      {/* Play/Pause, Add Panel, FPS, 表示切替 */}
      <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            onClick={onPlayPause}
            className="gap-1.5 font-semibold text-sm h-10 px-4"
            disabled={manualInputMode}
          >
            {isPlaying ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={onAddPanel}
            className="gap-1.5 font-semibold text-sm h-10 px-4"
          >
            <Plus size={18} />
            Add Panel
          </Button>
          
          <Badge variant="secondary" className="text-sm px-3 py-1.5 font-mono">
            {fps} FPS
          </Badge>
          
          {onHideControlPanel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onHideControlPanel}
              className="gap-1.5 text-sm h-10 px-3 text-muted-foreground hover:text-foreground"
              title="パネルを非表示"
            >
              <EyeSlash size={18} />
              非表示
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground mr-1">表示:</span>
          <ToggleGroup 
            type="multiple" 
            value={enabledPreviews}
            variant="outline"
            size="sm"
          >
            <ToggleGroupItem 
              value="glow" 
              aria-label="Glow表示"
              onClick={() => onTogglePreview('glow')}
              className="text-sm h-9 px-3"
            >
              Glow
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="graph" 
              aria-label="グラフ表示"
              onClick={() => onTogglePreview('graph')}
              className="text-sm h-9 px-3"
            >
              グラフ
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="camera" 
              aria-label="カメラ表示"
              onClick={() => onTogglePreview('camera')}
              className="text-sm h-9 px-3"
            >
              カメラ
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="value" 
              aria-label="値表示"
              onClick={() => onTogglePreview('value')}
              className="text-sm h-9 px-3"
            >
              値
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      
      {/* Input Value と Animation Speed を横並び */}
      <div className="grid md:grid-cols-2 gap-3">
        {/* Input Value スライダー + 手動制御 + 三角波 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Input Value
            </label>
            <div className="flex items-center gap-2">
              {triangularWaveMode && (
                <Badge variant="outline" className="text-xs font-mono px-2 py-0.5">
                  Base: {baseInputValue.toFixed(3)}
                </Badge>
              )}
              <span className="text-base font-mono text-primary font-semibold">
                {inputValue.toFixed(3)}
              </span>
            </div>
          </div>
          
          <Slider
            value={[baseInputValue]}
            onValueChange={([value]) => onInputValueChange(value)}
            min={0}
            max={1}
            step={0.001}
            disabled={!manualInputMode}
            className="my-1"
          />
          
          <div className="relative text-[10px] text-muted-foreground font-mono h-5 px-1">
            <div className="absolute inset-x-1 flex items-start pt-1">
              {[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((mark) => (
                <div
                  key={mark}
                  className="absolute flex flex-col items-center gap-0.5"
                  style={{ left: `${mark * 100}%`, transform: 'translateX(-50%)' }}
                >
                  <div className={`w-px ${mark % 0.5 === 0 ? 'h-2 bg-muted-foreground' : mark % 0.1 === 0 ? 'h-1.5 bg-muted-foreground/50' : 'h-1 bg-muted-foreground/30'}`} />
                  {mark % 0.5 === 0 && (
                    <span className="text-[9px]">{mark.toFixed(1)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <div className="flex items-center gap-2">
              <Switch
                id="manual-input-mode"
                checked={manualInputMode}
                onCheckedChange={onManualInputModeChange}
              />
              <Label htmlFor="manual-input-mode" className="text-sm font-medium cursor-pointer">
                手動制御
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Switch
                id="triangular-wave-mode"
                checked={triangularWaveMode}
                onCheckedChange={onTriangularWaveModeChange}
              />
              <Label htmlFor="triangular-wave-mode" className="text-sm font-medium cursor-pointer">
                三角波
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Input
                id="input-value-field"
                type="number"
                value={baseInputValue.toFixed(3)}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  if (!isNaN(value) && value >= 0 && value <= 1) {
                    onInputValueChange(value)
                  }
                }}
                step={0.001}
                min={0}
                max={1}
                className="w-24 font-mono text-sm h-8 px-2"
                disabled={!manualInputMode}
              />
            </div>
          </div>
        </div>
        
        {/* Animation Speed スライダー */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground">
              Animation Speed
            </label>
            <span className="text-base font-mono text-primary font-semibold">
              {speed.toFixed(1)}x
            </span>
          </div>
          
          <Slider
            value={[speed]}
            onValueChange={([value]) => onSpeedChange(value)}
            min={0.1}
            max={3}
            step={0.1}
            disabled={manualInputMode}
            className="my-1"
          />
          
          <div className="relative text-[10px] text-muted-foreground font-mono h-5 px-1">
            <div className="absolute inset-x-1 flex items-start pt-1">
              {[0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0].map((mark) => {
                const position = ((mark - 0.1) / (3.0 - 0.1)) * 100
                const isMajor = mark === 0.1 || mark === 1.0 || mark === 2.0 || mark === 3.0
                return (
                  <div
                    key={mark}
                    className="absolute flex flex-col items-center gap-0.5"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className={`w-px ${isMajor ? 'h-2 bg-muted-foreground' : 'h-1.5 bg-muted-foreground/50'}`} />
                    {isMajor && (
                      <span className="text-[9px]">{mark.toFixed(1)}x</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2 pt-1">
            <Input
              id="speed-value-field"
              type="number"
              value={speed.toFixed(1)}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value) && value >= 0.1 && value <= 3) {
                  onSpeedChange(value)
                }
              }}
              step={0.1}
              min={0.1}
              max={3}
              className="w-24 font-mono text-sm h-8 px-2"
              disabled={manualInputMode}
            />
            <span className="text-sm text-muted-foreground">直接入力</span>
          </div>
        </div>
      </div>
      
      {/* End Pause Duration スライダー */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">
            終点停止時間
          </label>
          <span className="text-base font-mono text-primary font-semibold">
            {endPauseDuration.toFixed(1)}秒
          </span>
        </div>
        
        <Slider
          value={[endPauseDuration]}
          onValueChange={([value]) => onEndPauseDurationChange(value)}
          min={0}
          max={10}
          step={0.1}
          disabled={manualInputMode}
          className="my-1"
        />
        
        <div className="relative text-[10px] text-muted-foreground font-mono h-5 px-1">
          <div className="absolute inset-x-1 flex items-start pt-1">
            {[0, 2, 4, 6, 8, 10].map((mark) => {
              const position = (mark / 10) * 100
              return (
                <div
                  key={mark}
                  className="absolute flex flex-col items-center gap-0.5"
                  style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-px h-2 bg-muted-foreground" />
                  <span className="text-[9px]">{mark}s</span>
                </div>
              )
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2 pt-1">
          <Input
            id="end-pause-value-field"
            type="number"
            value={endPauseDuration.toFixed(1)}
            onChange={(e) => {
              const value = parseFloat(e.target.value)
              if (!isNaN(value) && value >= 0 && value <= 10) {
                onEndPauseDurationChange(value)
              }
            }}
            step={0.1}
            min={0}
            max={10}
            className="w-24 font-mono text-sm h-8 px-2"
            disabled={manualInputMode}
          />
          <span className="text-sm text-muted-foreground">直接入力</span>
        </div>
      </div>
      
      {/* ============================================= */}
      {/* Advanced Settings（アコーディオン形式） */}
      {/* ============================================= */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="advanced-settings" className="border rounded-lg px-2">
          <AccordionTrigger className="hover:no-underline py-1.5">
            <div className="flex items-center gap-1.5">
              <GearSix size={16} className="text-muted-foreground" />
              <span className="text-xs font-semibold">Advanced Settings</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col md:flex-row gap-3 pt-1">
              {/* 左側カラム: プレビュー詳細設定 + ガンマ補正 */}
              <div className="flex flex-col gap-3 md:w-1/2">
                {/* プレビュー詳細設定グループ */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                <div className="text-sm font-semibold text-foreground">プレビュー詳細設定</div>
                
                {/* 全パネル一括設定 */}
                {onSetAllEaseType && (
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                        全パネル一括設定
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSetAllEaseType('easein')
                            toast.success('全パネルをEaseInに設定しました')
                          }}
                          className="font-semibold text-xs h-7 px-2"
                        >
                          全てIn
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSetAllEaseType('easeout')
                            toast.success('全パネルをEaseOutに設定しました')
                          }}
                          className="font-semibold text-xs h-7 px-2"
                        >
                          全てOut
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            onSetAllEaseType('easeboth')
                            toast.success('全パネルをEaseBothに設定しました')
                          }}
                          className="font-semibold text-xs h-7 px-2"
                        >
                          全てBoth
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* カードサイズ */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-muted-foreground">カードサイズ</label>
                    <span className="text-sm font-mono text-primary font-semibold">
                      {cardScale.toFixed(2)}x
                    </span>
                  </div>
                  
                  <Slider
                    value={[cardScale]}
                    onValueChange={([value]) => onCardScaleChange(value)}
                    min={0.5}
                    max={2.0}
                    step={0.05}
                    className="my-0.5"
                  />
                  
                  <div className="flex justify-between text-[9px] text-muted-foreground font-mono px-0.5">
                    <span>0.5x</span>
                    <span>1.0x</span>
                    <span>1.5x</span>
                    <span>2.0x</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Input
                      id="card-scale-field"
                      type="number"
                      value={cardScale.toFixed(2)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0.5 && value <= 2.0) {
                          onCardScaleChange(value)
                        }
                      }}
                      step={0.05}
                      min={0.5}
                      max={2.0}
                      className="w-20 font-mono text-xs h-7 px-2"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onCardScaleChange(1.0)
                        toast.success('カードサイズをデフォルトに戻しました')
                      }}
                      className="text-xs h-7"
                    >
                      リセット
                    </Button>
                  </div>
                </div>
                </div>
              
                {/* ガンマ補正グループ */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    ガンマ補正
                  </label>
                  <span className="text-sm font-mono text-primary font-semibold">
                    γ = {gamma.toFixed(1)}
                  </span>
                </div>
                
                <Slider
                  value={[gamma]}
                  onValueChange={([value]) => onGammaChange(value)}
                  min={0.0}
                  max={5.0}
                  step={0.1}
                  className="my-0.5"
                />
                
                <div className="flex justify-between text-[9px] text-muted-foreground font-mono px-0.5">
                  <span>0</span>
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
                
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <Input
                      id="gamma-value-field"
                      type="number"
                      value={gamma.toFixed(1)}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0.0) {
                          onGammaChange(value)
                        }
                      }}
                      step={0.1}
                      min={0.0}
                      className="w-20 font-mono text-xs h-7 px-2"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      id="apply-gamma-filter"
                      checked={enabledFilters.includes('gamma')}
                      onCheckedChange={() => onToggleFilter('gamma')}
                    />
                    <Label htmlFor="apply-gamma-filter" className="text-xs font-medium cursor-pointer">
                      適用
                    </Label>
                  </div>
                </div>
                </div>
              </div>
              
              {/* 右側カラム: カメラ設定グループ（カメラプレビュー有効時のみ表示） */}
              {enabledPreviews.includes('camera') && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-3 md:flex-1">
                  <div className="text-sm font-semibold text-foreground">カメラ設定</div>
                  
                  {/* 設定項目を2列グリッドで配置 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 座標系 */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground block">
                        座標系
                      </label>
                      <ToggleGroup 
                        type="single" 
                        value={coordinateSystem} 
                        onValueChange={(value) => value && onCoordinateSystemChange(value as 'left-handed' | 'right-handed')}
                        variant="outline"
                        className="justify-start"
                        size="sm"
                      >
                        <ToggleGroupItem value="left-handed" className="text-xs px-2 h-7">
                          左手系
                        </ToggleGroupItem>
                        <ToggleGroupItem value="right-handed" className="text-xs px-2 h-7">
                          右手系
                        </ToggleGroupItem>
                      </ToggleGroup>
                      <p className="text-[10px] text-muted-foreground">
                        {coordinateSystem === 'left-handed' ? 'Beat Saber, Unity' : 'Three.js, Blender'}
                      </p>
                    </div>
                    
                    {/* アスペクト比 */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-muted-foreground block">
                        アスペクト比
                      </label>
                      <ToggleGroup 
                        type="single" 
                        value={cameraAspectRatio} 
                        onValueChange={(value) => value && onCameraAspectRatioChange(value)}
                        variant="outline"
                        className="flex flex-col items-stretch gap-1"
                        size="sm"
                      >
                        <ToggleGroupItem value="16/9" className="text-xs px-2 h-7 w-full justify-center">
                          16:9
                        </ToggleGroupItem>
                        <ToggleGroupItem value="4/3" className="text-xs px-2 h-7 w-full justify-center">
                          4:3
                        </ToggleGroupItem>
                        <ToggleGroupItem value="1/1" className="text-xs px-2 h-7 w-full justify-center">
                          1:1
                        </ToggleGroupItem>
                        <ToggleGroupItem value="21/9" className="text-xs px-2 h-7 w-full justify-center">
                          21:9
                        </ToggleGroupItem>
                        <ToggleGroupItem value="custom" className="text-xs px-2 h-7 w-full justify-center">
                          他
                        </ToggleGroupItem>
                      </ToggleGroup>
                      {cameraAspectRatio === 'custom' && (
                        <div className="flex items-center gap-2 pt-0.5">
                          <Input
                            id="custom-aspect-ratio"
                            type="text"
                            defaultValue=""
                            onChange={(e) => {
                              const value = e.target.value
                              if (value && value !== 'custom') {
                                onCameraAspectRatioChange(value)
                              }
                            }}
                            placeholder="例: 2.35/1"
                            className="w-24 font-mono text-xs h-7"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* 最大表示数 */}
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-medium text-muted-foreground">最大表示数</label>
                    <Input
                      id="max-camera-previews"
                      type="number"
                      value={maxCameraPreviews}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        if (!isNaN(value) && value >= 1 && value <= 24) {
                          onMaxCameraPreviewsChange(value)
                        }
                      }}
                      step={1}
                      min={1}
                      max={24}
                      className="w-16 font-mono text-xs h-7 px-2 text-center"
                    />
                    <span className="text-xs text-muted-foreground">個</span>
                  </div>
                  
                  {/* 位置設定 */}
                  <div className="space-y-1.5 pt-1 border-t border-border/50">
                    <label className="text-xs font-medium text-muted-foreground">カメラ位置</label>
                    
                    {/* 開始位置 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground w-7 shrink-0">開始</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/80 w-3">X</span>
                        <Input
                          id="camera-start-x"
                          type="number"
                          value={cameraStartPos.x.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              onCameraStartPosChange({ ...cameraStartPos, x: value })
                            }
                          }}
                          step={0.5}
                          className="w-[4.5rem] font-mono text-xs h-7 px-1.5 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/80 w-3">Y</span>
                        <Input
                          id="camera-start-y"
                          type="number"
                          value={cameraStartPos.y.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              onCameraStartPosChange({ ...cameraStartPos, y: value })
                            }
                          }}
                          step={0.5}
                          className="w-[4.5rem] font-mono text-xs h-7 px-1.5 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/80 w-3">Z</span>
                        <Input
                          id="camera-start-z"
                          type="number"
                          value={cameraStartPos.z.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              onCameraStartPosChange({ ...cameraStartPos, z: value })
                            }
                          }}
                          step={0.5}
                          className="w-[4.5rem] font-mono text-xs h-7 px-1.5 text-center"
                        />
                      </div>
                    </div>
                    
                    {/* 終了位置 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-muted-foreground w-7 shrink-0">終了</span>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/80 w-3">X</span>
                        <Input
                          id="camera-end-x"
                          type="number"
                          value={cameraEndPos.x.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              onCameraEndPosChange({ ...cameraEndPos, x: value })
                            }
                          }}
                          step={0.5}
                          className="w-[4.5rem] font-mono text-xs h-7 px-1.5 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/80 w-3">Y</span>
                        <Input
                          id="camera-end-y"
                          type="number"
                          value={cameraEndPos.y.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              onCameraEndPosChange({ ...cameraEndPos, y: value })
                            }
                          }}
                          step={0.5}
                          className="w-[4.5rem] font-mono text-xs h-7 px-1.5 text-center"
                        />
                      </div>
                      <div className="flex items-center gap-0.5">
                        <span className="text-[10px] text-muted-foreground/80 w-3">Z</span>
                        <Input
                          id="camera-end-z"
                          type="number"
                          value={cameraEndPos.z.toFixed(1)}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            if (!isNaN(value)) {
                              onCameraEndPosChange({ ...cameraEndPos, z: value })
                            }
                          }}
                          step={0.5}
                          className="w-[4.5rem] font-mono text-xs h-7 px-1.5 text-center"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCameraStartPosChange({ x: 2.0, y: 1.0, z: -5.0 })
                      onCameraEndPosChange({ x: 2.0, y: 1.0, z: 5.0 })
                      onCameraAspectRatioChange('16/9')
                      toast.success('カメラ設定をデフォルトに戻しました')
                    }}
                    className="text-xs h-7"
                  >
                    デフォルトに戻す
                  </Button>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
})
