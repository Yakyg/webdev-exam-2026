import { getCourses, getTutors, createOrder } from './api.js';

let allCoursesOriginal = [];             
let allCourses = [];
let allTutors = [];
let currentCourse = null;
let selectedTutor = null;

// Показ уведомления
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast notification bg-${type} text-white`;
    toast.innerHTML = `<div class="toast-body">${message}</div>`;
    document.body.appendChild(toast);
    new bootstrap.Toast(toast, { autohide: true, delay: 5000 }).show();
    setTimeout(() => toast.remove(), 5000);
}

// Рендер курсов 
function renderCourses(page = 1) {
    const container = document.getElementById('coursesContainer');
    container.innerHTML = '';

    const perPage = 5;
    const start = (page - 1) * perPage;
    const pageCourses = allCourses.slice(start, start + perPage);

    pageCourses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'col';
        card.innerHTML = `
            <div class="card course-card h-100">
                <div class="card-body">
                    <h5 class="card-title">${course.name}</h5>
                    <p class="card-text text-muted">${course.level} • ${course.teacher}</p>
                    <p class="card-text">${course.description.substring(0, 120)}...</p>
                    <button class="btn btn-primary w-100" onclick="openCourseModal(${course.id})">Подать заявку</button>
                </div>
            </div>`;
        container.appendChild(card);
    });

    renderPagination(page);
}

function renderPagination(currentPage) {
    const totalPages = Math.ceil(allCourses.length / 5);
    if (totalPages <= 1) {
        document.getElementById('coursesPagination').innerHTML = '';
        return;
    }

    let html = `<ul class="pagination justify-content-center">`;

    for (let i = 1; i <= totalPages; i++) {
        const active = i === currentPage ? 'active' : '';
        html += `
            <li class="page-item ${active}">
                <button class="page-link pag-btn" 
                        type="button" 
                        data-page="${i}">
                    ${i}
                </button>
            </li>`;
    }

    html += `</ul>`;
    document.getElementById('coursesPagination').innerHTML = html;

    // Добавляем один общий обработчик событий
    document.querySelectorAll('.pag-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const page = parseInt(btn.dataset.page);
            renderCourses(page);
        });
    });
}
// Открытие модалки курса
window.openCourseModal = async function(id) {
    currentCourse = allCourses.find(c => c.id === id);
    if (!currentCourse) return;

    const body = document.getElementById('courseModalBody');
    body.innerHTML = `
        <div class="mb-3">
            <label class="form-label">Название курса</label>
            <input type="text" class="form-control" value="${currentCourse.name}" readonly>
        </div>
        <div class="mb-3">
            <label class="form-label">Преподаватель</label>
            <input type="text" class="form-control" value="${currentCourse.teacher}" readonly>
        </div>

        <div class="row">
            <div class="col-md-6 mb-3">
                <label class="form-label">Дата начала</label>
                <input type="date" id="startDate" class="form-control" onchange="updateTimeOptions()">
            </div>
            <div class="col-md-6 mb-3">
                <label class="form-label">Время начала</label>
                <select id="startTime" class="form-select" onchange="calculateCost()"></select>
            </div>
        </div>

        <div class="mb-3">
            <label class="form-label">Продолжительность</label>
            <input type="text" class="form-control" value="${currentCourse.total_length} недель" readonly>
        </div>

        <div class="mb-3">
            <label class="form-label">Количество студентов</label>
            <input type="number" id="students" value="1" min="1" max="20" class="form-control" onchange="calculateCost()">
        </div>

        <div class="mb-4">
            <label class="form-label">Дополнительные опции</label>
            <div id="optionsContainer"></div>
        </div>

        <div class="alert alert-info">
            <strong>Итоговая стоимость:</strong> <span id="totalCost" class="fw-bold">0 ₽</span>
        </div>
    `;

    // Заполняем даты из API
    const dateInput = document.getElementById('startDate');
    const uniqueDates = [...new Set(currentCourse.start_dates.map(d => d.split('T')[0]))];
    dateInput.min = uniqueDates[0] || '';
    dateInput.value = uniqueDates[0] || '';

    updateTimeOptions();
    renderOptions();
    calculateCost();

    new bootstrap.Modal(document.getElementById('courseModal')).show();
};

function updateTimeOptions() {
    const selectedDate = document.getElementById('startDate').value;
    const select = document.getElementById('startTime');
    select.innerHTML = '';

    const daySlots = currentCourse.start_dates.filter(dt => dt.startsWith(selectedDate));
    daySlots.forEach(slot => {
        const time = slot.split('T')[1].slice(0,5);
        const endTime = addHours(time, currentCourse.week_length);
        const option = document.createElement('option');
        option.value = time;
        option.textContent = `${time} — ${endTime}`;
        select.appendChild(option);
    });
    calculateCost();
}

function addHours(time, hours) {
    const [h, m] = time.split(':').map(Number);
    let newH = h + hours;
    return `${newH.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
}

function renderOptions() {
    const container = document.getElementById('optionsContainer');
    const options = [
        {key:'early_registration', label:'Скидка за раннюю регистрацию (-10%)', auto:true},
        {key:'group_enrollment', label:'Групповая запись (5+ человек, -15%)', auto:true},
        {key:'intensive_course', label:'Интенсивный курс (+20%)', auto: currentCourse.week_length >= 5},
        {key:'supplementary', label:'Дополнительные материалы (+2000 ₽/чел.)'},
        {key:'personalized', label:'Персонализация (+1500 ₽/неделя)'},
        {key:'excursions', label:'Культурные экскурсии (+25%)'},
        {key:'assessment', label:'Оценка уровня (+300 ₽)'},
        {key:'interactive', label:'Интерактивная платформа (+50%)'}
    ];

    container.innerHTML = options.map(opt => `
        <div class="form-check">
            <input class="form-check-input option-check" type="checkbox" id="${opt.key}" 
                   ${opt.auto ? 'checked disabled' : ''} onchange="calculateCost()">
            <label class="form-check-label" for="${opt.key}">${opt.label}</label>
        </div>
    `).join('');
}

window.calculateCost = function() {
    if (!currentCourse) return;

    const students = parseInt(document.getElementById('students').value) || 1;
    const startTimeStr = document.getElementById('startTime').value;
    const startHour = parseInt(startTimeStr.split(':')[0]);

    let durationHours = currentCourse.total_length * currentCourse.week_length;
    let fee = currentCourse.course_fee_per_hour * durationHours;

    // выходные/праздники
    const isWeekend = new Date(document.getElementById('startDate').value).getDay() % 6 === 0;
    if (isWeekend) fee *= 1.5;

    // доплаты
    let morning = (startHour >= 9 && startHour <= 12) ? 400 : 0;
    let evening = (startHour >= 18 && startHour <= 20) ? 1000 : 0;

    let total = (fee + morning + evening) * students;

    // скидки/надбавки
    if (document.getElementById('early_registration')?.checked) total *= 0.9;
    if (document.getElementById('group_enrollment')?.checked && students >= 5) total *= 0.85;
    if (document.getElementById('intensive_course')?.checked) total *= 1.2;
    if (document.getElementById('supplementary')?.checked) total += 2000 * students;
    if (document.getElementById('personalized')?.checked) total += 1500 * currentCourse.total_length;
    if (document.getElementById('excursions')?.checked) total *= 1.25;
    if (document.getElementById('assessment')?.checked) total += 300;
    if (document.getElementById('interactive')?.checked) total *= 1.5;

    document.getElementById('totalCost').textContent = Math.round(total) + ' ₽';
};

window.submitCourseOrder = async function() {
    const order = {
        course_id: currentCourse.id,
        date_start: document.getElementById('startDate').value,
        time_start: document.getElementById('startTime').value,
        duration: currentCourse.total_length * currentCourse.week_length,
        persons: parseInt(document.getElementById('students').value),
        price: parseInt(document.getElementById('totalCost').textContent),
        early_registration: !!document.getElementById('early_registration')?.checked,
        group_enrollment: !!document.getElementById('group_enrollment')?.checked,
        intensive_course: !!document.getElementById('intensive_course')?.checked,
        supplementary: !!document.getElementById('supplementary')?.checked,
        personalized: !!document.getElementById('personalized')?.checked,
        excursions: !!document.getElementById('excursions')?.checked,
        assessment: !!document.getElementById('assessment')?.checked,
        interactive: !!document.getElementById('interactive')?.checked
    };

    try {
        await createOrder(order);
        showToast('Заявка успешно отправлена!');
        bootstrap.Modal.getInstance(document.getElementById('courseModal')).hide();
    } catch (e) {}
};

// Репетиторы
window.openTutorModal = function(tutor) {
    selectedTutor = tutor;
    document.getElementById('selectedTutorInfo').innerHTML = `
        <strong>${tutor.name}</strong> • ${tutor.language_level} • ${tutor.price_per_hour} ₽/ч
    `;
    new bootstrap.Modal(document.getElementById('tutorModal')).show();
};

window.submitTutorOrder = async function() {
    const order = {
        tutor_id: selectedTutor.id,
        date_start: document.getElementById('tutorDate').value,
        time_start: document.getElementById('tutorTime').value,
        duration: parseInt(document.getElementById('tutorDuration').value),
        persons: 1,
        price: selectedTutor.price_per_hour * parseInt(document.getElementById('tutorDuration').value)
    };

    try {
        await createOrder(order);
        showToast('Заявка на репетитора отправлена!');
        bootstrap.Modal.getInstance(document.getElementById('tutorModal')).hide();
    } catch (e) {}
};

// Загрузка данных при старте
async function init() {
    allCoursesOriginal = await getCourses();
    allCourses = [...allCoursesOriginal];

    allTutors = await getTutors();

    renderCourses(1);
    renderTutors();
    populateLanguageFilter();

    initMap();
}

function renderTutors(filtered = allTutors) {
    const tbody = document.querySelector('#tutorsTable tbody');
    tbody.innerHTML = '';

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = 'tutor-row';                     
        tr.dataset.tutorId = t.id;                      

        tr.innerHTML = `
            <td><img src="https://via.placeholder.com/50" class="rounded-circle" alt=""></td>
            <td>${t.name}</td>
            <td>${t.language_level}</td>
            <td>${t.languages_offered.join(', ')}</td>
            <td>${t.work_experience} лет</td>
            <td>${t.price_per_hour} ₽</td>
            <td>
                <button class="btn btn-sm btn-outline-primary select-tutor-btn" 
                        data-tutor-id="${t.id}">
                    Выбрать
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // После отрисовки вешаем обработчики на кнопки
    document.querySelectorAll('.select-tutor-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tutorId = Number(btn.dataset.tutorId);
            const tutor = allTutors.find(t => t.id === tutorId);
            if (!tutor) return;

            // Снимаем выделение со всех строк
            document.querySelectorAll('.tutor-row').forEach(row => {
                row.classList.remove('selected');
            });

            // Выделяем текущую строку
            const row = btn.closest('tr');
            row.classList.add('selected');

            // Сохраняем выбранного репетитора и открываем модалку
            selectedTutor = tutor;
            document.getElementById('selectedTutorInfo').innerHTML = `
                <strong>${tutor.name}</strong> • ${tutor.language_level} • ${tutor.price_per_hour} ₽/ч
            `;
            new bootstrap.Modal(document.getElementById('tutorModal')).show();
        });
    });
}

function populateLanguageFilter() {
    const languages = [...new Set(allTutors.flatMap(t => t.languages_offered))];
    const select = document.getElementById('languageFilter');
    languages.forEach(lang => {
        const opt = document.createElement('option');
        opt.value = lang;
        opt.textContent = lang;
        select.appendChild(opt);
    });
}

window.filterTutors = function() {
    const lang     = document.getElementById('languageFilter').value;
    const level    = document.getElementById('tutorLevelFilter').value;
    const expRange = document.getElementById('experienceFilter').value;

    let filtered = allTutors;

    if (lang)   filtered = filtered.filter(t => t.languages_offered.includes(lang));
    if (level)  filtered = filtered.filter(t => t.language_level === level);

    if (expRange) {
        const [minStr, maxStr] = expRange.split('-');
        const min = parseInt(minStr);
        const max = maxStr === '+' ? Infinity : parseInt(maxStr);

        filtered = filtered.filter(t => {
            const exp = t.work_experience;
            return exp >= min && (max === Infinity || exp <= max);
        });
    }

    renderTutors(filtered);
};



window.filterCourses = function() {
    const term  = document.getElementById('courseSearch').value.toLowerCase().trim();
    const level = document.getElementById('levelFilter').value;

    let filtered = allCoursesOriginal.filter(course => {
        const nameMatch = course.name.toLowerCase().includes(term);
        const levelMatch = !level || course.level === level;
        return nameMatch && levelMatch;
    });

    allCourses = filtered;          
    renderCourses(1);
};

function initMap() {
    ymaps.ready(() => {
        const myMap = new ymaps.Map('map', {
            center: [55.7558, 37.6173],  
            zoom: 11,
            controls: ['zoomControl', 'fullscreenControl']
        });

        // Массив мест 
        const places = [
            {
                name: 'Всероссийская библиотека иностранной литературы им. Рудомино',
                address: 'Николоямская ул., 1, Москва',
                hours: 'Пн–Пт 10:00–18:00, Сб–Вс выходной',
                contact: '+7 (495) 915–78–85, academy@libfl.ru',
                desc: 'Курсы английского, китайского, немецкого, испанского, арабского, итальянского. Бесплатные мероприятия и клубы.'
            },
            {
                name: 'Библиотека им. Н.А. Некрасова',
                address: 'Бауманская ул., 58/25 стр.14, Москва',
                hours: 'Еженедельные клубы',
                contact: 'nekrasovka.ru',
                desc: 'Разговорные клубы: итальянский, испанский, корейский, английский, французский, чувашский.'
            },
            {
                name: 'Российская государственная библиотека для молодёжи',
                address: 'Большая Черкизовская ул., 4 к.1, Москва',
                hours: 'Встречи 4 раза в месяц, напр. 19:00',
                contact: '+7 (499) 670-80-01, info@rgub.ru',
                desc: 'Ридинг-клуб: чтение на английском, французском, немецком, испанском. Грамматика и медленное чтение.'
            },
            {
                name: 'Japan Foundation',
                address: 'Николоямская ул., 1, Москва (4-й этаж)',
                hours: 'Семестры',
                contact: 'jpfmw.ru',
                desc: 'Бесплатные курсы японского для разных уровней с носителями.'
            },
            {
                name: 'Российско-немецкий дом',
                address: 'Малая Пироговская ул., 5, Москва',
                hours: 'Очно и онлайн',
                contact: 'deutschkurse.rusdeutsch.ru',
                desc: 'Клуб немецкого языка, культура Германии.'
            },
            {
                name: 'Израильский культурный центр',
                address: 'Стремянный пер., 38, Москва (4-й этаж)',
                hours: 'Курсы по 72 часа',
                contact: 'il4u.org.il',
                desc: 'Бесплатные курсы иврита на начальных уровнях.'
            },
            {
                name: 'Культурный центр им. Джавахарлала Неру',
                address: 'Воронцово Поле ул., 9 стр.2, Москва',
                hours: 'Членство 750 руб/мес',
                contact: '+7 (495) 783-75-35',
                desc: 'Курсы хинди, йога, индийская музыка.'
            },
            {
                name: 'Антикафе Ziferblat',
                address: 'Кузнецкий Мост ул., 19 стр.1, Москва',
                hours: 'После 18:00',
                contact: 'most.ziferblat.net',
                desc: 'Разговорные клубы английского, немецкого, французского, испанского.'
            },
            {
                name: 'Корейский культурный центр',
                address: 'Арбат ул., 24, Москва',
                hours: 'Набор 2 раза в год',
                contact: 'russia.korean-culture.org',
                desc: 'Бесплатные курсы корейского языка.'
            }
        ];

        // Геокодируем адреса и добавляем метки
    const geoPromises = places.map(place => {
        return ymaps.geocode(place.address, { results: 1 })
            .then(res => {
                const geoObject = res.geoObjects.get(0);
                if (geoObject) {
                    const coords = geoObject.geometry.getCoordinates();
                    console.log(`Успех для ${place.name}:`, coords); // ← для отладки

                    const balloonContent = `
                        <strong>${place.name}</strong><br>
                        <b>Адрес:</b> ${place.address}<br>
                       <b>Часы:</b> ${place.hours}<br>
                      <b>Контакт:</b> ${place.contact}<br><br>
                      ${place.desc}
                   `;

                  const placemark = new ymaps.Placemark(coords, {
                      hintContent: place.name,
                        balloonContent: balloonContent
                 }, {
                       preset: 'islands#blueEducationIcon'
                  });

                    myMap.geoObjects.add(placemark);
                    return coords;
                } else {
                   console.warn(`Не найдено координат для: ${place.address}`);
                  return null;
              }
              })
             .catch(err => {
                 console.error(`Ошибка геокодирования для "${place.address}":`, err);
                return null;
          });
    });

        // После всех геокодирований устанавливаем границы
        Promise.all(geoPromises).then(coordsList => {
            const validCoords = coordsList.filter(c => c);
            if (validCoords.length > 0) {
                myMap.setBounds(ymaps.util.bounds.fromPoints(validCoords), {
                    checkZoomRange: true,
                    precise: true
                });
            }
        });
    });
}


// Запуск
init();