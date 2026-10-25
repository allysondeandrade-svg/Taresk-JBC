Add-Type -AssemblyName System.Drawing

function Generate-Icon($size, $filename) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    
    # Fundo roxo sólido e arredondado
    $brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(108, 92, 231))
    $g.FillRectangle($brush, 0, 0, $size, $size)
    
    # Desenhar Letra T branca
    $font = New-Object System.Drawing.Font('Arial', [float]($size * 0.55), [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = [System.Drawing.StringAlignment]::Center
    $sf.LineAlignment = [System.Drawing.StringAlignment]::Center
    $rect = New-Object System.Drawing.RectangleF 0, 0, $size, $size
    $g.DrawString('T', $font, $textBrush, $rect, $sf)
    
    $bmp.Save($filename, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Output "Generated $filename ($size x $size)"
}

Generate-Icon 192 "public\icon-192.png"
Generate-Icon 512 "public\icon-512.png"
