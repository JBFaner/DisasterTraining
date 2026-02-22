$docPath = Join-Path $PSScriptRoot "temp_docx\word\document.xml"
$outPath = Join-Path $PSScriptRoot "docx_text_extract.txt"
$xml = New-Object System.Xml.XmlDocument
$xml.Load($docPath)
$nsMgr = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$nsMgr.AddNamespace("w", "http://schemas.openxmlformats.org/wordprocessingml/2006/main")
$nodes = $xml.SelectNodes("//w:t", $nsMgr)
$sb = New-Object System.Text.StringBuilder
foreach ($n in $nodes) { [void]$sb.Append($n.InnerText) }
$sb.ToString() | Set-Content -Path $outPath -Encoding UTF8
