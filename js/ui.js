function showNotification(message, type) {
    const container = document.getElementById('notifications');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    container.appendChild(alert);

    setTimeout(() => alert.remove(), 5000);
}
