document.getElementById('checkButton').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const progressBar = document.getElementById('progress');
    const changelog = document.getElementById('changelog');

    // Configura listeners de progresso
    window.electronAPI.onDownloadProgress((progress) => {
        progressBar.style.width = `${progress}%`;
    });

    window.electronAPI.onInstallProgress((progress) => {
        progressBar.style.width = `${progress}%`;
    });

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

    changelog.innerHTML = `
        <strong>Nova versão ${updateCheck.version}</strong><br>
        ${updateCheck.changelog || "Melhorias de desempenho e correções de bugs."}
    `;

    status.textContent = "📥 Baixando atualização...";
    const zipPath = await window.electronAPI.downloadUpdate(updateCheck.downloadUrl);

    status.textContent = "🔧 Instalando atualização...";
    const installResult = await window.electronAPI.installUpdate(zipPath);

    if (installResult.error) {
        status.textContent = `❌ Falha na instalação: ${installResult.error}`;
        return;
    }

    status.textContent = "✅ Atualização concluída! Reinicie para aplicar.";
    document.getElementById('restartButton').disabled = false;
});

// Corrigido o typo "restartButton" (estava "restartButton")
document.getElementById('restartButton').addEventListener('click', () => {
    window.electronAPI.restartApp();
});