document.getElementById('checkButton').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const progress = document.getElementById('progress');
    const changelog = document.getElementById('changelog');
    
    status.textContent = "🔄 Procurando atualizações...";
    const updateCheck = await window.electronAPI.checkForUpdates();
    
    if (updateCheck.error) {
        status.textContent = "❌ Erro ao verificar atualizações.";
        return;
    }
    
    if (!updateCheck.available) {
        status.textContent = "✅ Você já tem a versão mais recente.";
        return;
    }
    
    // Mostra o changelog
    changelog.innerHTML = `
        <strong>Nova versão ${updateCheck.version}</strong><br>
        ${updateCheck.changelog || "Melhorias de desempenho e correções de bugs."}
    `;
    
    // Baixa a atualização
    status.textContent = "📥 Baixando atualização...";
    await window.electronAPI.downloadUpdate(updateCheck.downloadUrl);
    
    // Instala a atualização
    status.textContent = "🔧 Instalando atualização...";
    const installResult = await window.electronAPI.installUpdate();
    
    if (installResult.error) {
        status.textContent = "❌ Falha na instalação.";
        return;
    }
    
    status.textContent = "✅ Atualização concluída! Reinicie para aplicar.";
    document.getElementById('restartButton').disabled = false;
});

document.getElementById('restartButton').addEventListener('click', () => {
    window.electronAPI.restartApp();
});