fetch(`${API_URL}/api/orders?api_key=${API_KEY}`)
    .then(r => r.json())
    .then(data => {
        const table = document.getElementById('orders-table');
        data.forEach((o, i) => {
            table.innerHTML += `
            <tr>
                <td>${i + 1}</td>
                <td>${o.course_id}</td>
                <td>${o.date_start}</td>
                <td>${o.price}</td>
                <td>
                    <button class="btn btn-danger btn-sm">Удалить</button>
                </td>
            </tr>`;
        });
    })
    .catch(() => showNotification('Ошибка загрузки заявок', 'danger'));
