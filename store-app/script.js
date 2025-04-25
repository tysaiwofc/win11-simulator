document.getElementById('appForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const formData = new FormData(e.target);
    const app = Object.fromEntries(formData.entries());
  
    const res = await fetch('/api/apps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    });
  
    const result = await res.json();
    alert(result.message);
    e.target.reset();
    loadApps();
  });
  
  async function loadApps() {
    const res = await fetch('/api/apps');
    const apps = await res.json();
  
    const container = document.getElementById('appsContainer');
    container.innerHTML = '';
  
    apps.forEach(app => {
      const div = document.createElement('div');
      div.className = 'app';
      div.innerHTML = `
        <h2>${app.name}</h2>
        <p><strong>Autor:</strong> ${app.author}</p>
        <p>${app.description}</p>
        ${app.screenshots ? `<img src="${app.screenshots}" width="200">` : ''}
        <p><a href="${app.downloadUrl}" target="_blank">Baixar</a></p>
        <p><strong>Tags:</strong> ${app.tags}</p>
      `;
      container.appendChild(div);
    });
  }
  
  loadApps();
  