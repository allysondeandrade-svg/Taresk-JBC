Add-Type -AssemblyName System.Drawing
$imgPath = Join-Path (Get-Location) "public\fogao_produto_modelo.png"
$src = [System.Drawing.Image]::FromFile($imgPath)
Write-Host "Width: $($src.Width), Height: $($src.Height)"

# O modelo à esquerda no print tem o fogão na parte superior
# Width total é ~692, altura ~356. A metade esquerda tem 0 a ~338
# A imagem do produto fica aproximadamente entre x=40, y=25, w=265, h=180
$rect = New-Object System.Drawing.Rectangle(40, 25, 265, 180)
$bmp = New-Object System.Drawing.Bitmap($rect.Width, $rect.Height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.DrawImage($src, 0, 0, $rect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$outPath = Join-Path (Get-Location) "public\fogao_thumb.png"
$bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$src.Dispose()
Write-Host "Saved: $outPath"
