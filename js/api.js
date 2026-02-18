const API_BASE = 'http://exam-api-courses.std-900.ist.mospolytech.ru';
const API_KEY  = '7f66c6a6-569e-4bb3-945b-b82b7a90c9ac';   

const headers = {
    'Content-Type': 'application/json'
};

async function apiRequest(url, method = 'GET', body = null) {
    const fullUrl = `${API_BASE}${url}?api_key=${API_KEY}`;
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(fullUrl, options);
    const data = await res.json();

    if (!res.ok) {
        showToast(`Ошибка: ${data.error || 'Неизвестная ошибка'}`, 'danger');
        throw data;
    }
    return data;
}

// ----------------- Обёртки -----------------
export async function getCourses() {
    return apiRequest('/api/courses');
}

export async function getTutors() {
    return apiRequest('/api/tutors');
}

export async function getOrders() {
    return apiRequest('/api/orders');
}

export async function createOrder(orderData) {
    return apiRequest('/api/orders', 'POST', orderData);
}

export async function updateOrder(id, orderData) {
    return apiRequest(`/api/orders/${id}`, 'PUT', orderData);
}

export async function deleteOrder(id) {
    return apiRequest(`/api/orders/${id}`, 'DELETE');
}



