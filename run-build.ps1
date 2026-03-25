    param($ip)
    $pass = 'Abc12345!'
    $secpasswd = ConvertTo-SecureString $pass -AsPlainText -Force
    $creds = New-Object System.Management.Automation.PSCredential ('root', $secpasswd)
    
    # Check if Posh-SSH is installed, install if needed
    if (!(Get-Module Posh-SSH -ListAvailable)) {
        Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
    }
    Import-Module Posh-SSH
    
    $session = New-SSHSession -ComputerName $ip -Credential $creds -AcceptKey
    $result = Invoke-SSHCommand -SessionId $session.SessionId -Command 'cd /var/www/youposh/backend && npm run build 2>&1'
    Write-Host "
=== BUILD OUTPUT ==="
    Write-Host $result.Output
    Write-Host "
=== BUILD ERROR ==="
    Write-Host $result.Error
    Remove-SSHSession -SessionId $session.SessionId
