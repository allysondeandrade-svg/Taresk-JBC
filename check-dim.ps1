Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\allys\.gemini\antigravity-ide\brain\fcacac85-e28f-451a-81d5-2b0afd2ddf17\.user_uploaded\media_1792896562043.png'
$img = [System.Drawing.Image]::FromFile($imgPath)
Write-Output "Size: $($img.Width) x $($img.Height)"
$img.Dispose()
