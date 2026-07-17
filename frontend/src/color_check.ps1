Add-Type -AssemblyName System.Drawing

$brainDir = 'C:\Users\PC\.gemini\antigravity\brain\2ece5534-9ba2-4867-89e9-4d91dbf37663'
$files = Get-ChildItem -Path $brainDir -Filter 'media__*'

foreach ($file in $files) {
    try {
        $img = [System.Drawing.Image]::FromFile($file.FullName)
        $w = $img.Width
        $h = $img.Height
        $bmp = New-Object System.Drawing.Bitmap($img)
        
        # Central color sample
        $pixel = $bmp.GetPixel([int]($w / 2), [int]($h / 2))
        
        Write-Host "$($file.Name) ($w x $h) - Center RGB: $($pixel.R), $($pixel.G), $($pixel.B) (Hex: #$($pixel.R.ToString('X2'))$($pixel.G.ToString('X2'))$($pixel.B.ToString('X2')))"
        
        $img.Dispose()
        $bmp.Dispose()
    } catch {
        Write-Host "Error parsing $($file.Name): $_"
    }
}
