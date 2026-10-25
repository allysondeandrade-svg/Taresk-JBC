Add-Type -AssemblyName System.Drawing

function Extract-InnerIcon($inputPath, $outputPath, $cropRatio) {
    $src = [System.Drawing.Image]::FromFile($inputPath)
    $margin = [int]($src.Width * $cropRatio)
    $w = $src.Width - ($margin * 2)
    $h = $src.Height - ($margin * 2)
    
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $srcRect = New-Object System.Drawing.Rectangle($margin, $margin, $w, $h)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
    $g.DrawImage($src, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $bmp.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $src.Dispose()
    Write-Output "Saved $outputPath"
}

Extract-InnerIcon 'C:\Users\allys\.gemini\antigravity-ide\brain\fcacac85-e28f-451a-81d5-2b0afd2ddf17\.user_uploaded\media_1792896345440.png' 'public\icon_rocket_inner_green.png' 0.16
Extract-InnerIcon 'C:\Users\allys\.gemini\antigravity-ide\brain\fcacac85-e28f-451a-81d5-2b0afd2ddf17\.user_uploaded\media_1792896353078.png' 'public\icon_pie_inner_green.png' 0.16
