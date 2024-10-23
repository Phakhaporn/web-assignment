// const API_HOST = "http://localhost:3000";
const API_HOST = window.API_HOST || "https://web-assignment-dev.onrender.com";
let currentPage = 1;
const pageSize = 20;

//for select page
function showPage(pageId) {
    console.log(pageId); // บันทึกค่า pageId ที่กำลังถูกเรียกใช้
    // Hide all pages
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.style.display = 'none');

    // Show the selected page
    document.getElementById(pageId).style.display = 'block';
}
    // showPage('viewconf');

// enter id to show config
    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('viewconfbtn').addEventListener('click', async () => {
            const droneId = document.getElementById('droneId').value;
    
            if (droneId) {
                try {
                    const response = await fetch(`${API_HOST}/configs/${droneId}`);
                    if (response.ok) {
                        const data = await response.json();
                        document.getElementById('confResult').innerHTML = `
                            <p>Drone ID: ${data.drone_id}</p>
                            <p>Drone Name: ${data.drone_name}</p>
                            <p>Light: ${data.light}</p>
                            <p>Country: ${data.country}</p>
                            <p>Max Speed: ${data.max_speed}</p>
                            <p>Population: ${data.population}</p>
                        `;

                    } else {
                        document.getElementById('confResult').innerText = 'Drone config not found';
                    }
                } catch (error) {
                    document.getElementById('confResult').innerText = 'Error fetching drone config';
                }
                
            } else {
                alert('Please enter a valid Drone ID');
            }
        });
    });
    
//input log
async function submitTemperatureLog(event) {
    event.preventDefault();
    
    const drone_id = document.getElementById('drone_id').value;
    const drone_name = document.getElementById('drone_name').value;
    const celsius = document.getElementById('celsius').value;
    const country = document.getElementById('country').value;

    const logData = {
        drone_id: Number(drone_id),
        drone_name: drone_name,
        celsius: Number(celsius),
        country: country
    };

    try {
        const response = await fetch((`https://web-assignment-dev.onrender.com/logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(logData)
        });

        if (response.ok) {
            const responseData = await response.json();
            console.log('Response:', responseData);
            alert('Log submitted successfully');
            fetchLogs(1); //refresh page
            // ล้างข้อมูลในฟอร์ม
            document.getElementById('templog-form').reset();
        } else {
            const errorText = await response.text(); // อ่านข้อความตอบกลับหากไม่ใช่ JSON
            console.error('Server error:', errorText);
            alert('Error submitting log: ' + errorText);
        }
    } catch (error) {
        console.error('Error submitting log:', error.message);
        alert('Error submitting log');
    }
}

//ดึงdata
async function fetchLogs(page) {
    console.log('fetchLogs called for page', page);
    try {
        const response = await fetch(`/logs?page=${page}&pageSize=${pageSize}`);
        const data = await response.json();

        console.log("Fetched data:", data.logs); // ตรวจสอบว่ามีการรับข้อมูลใหม่หรือไม่

        // เรียกฟังก์ชันเพื่อแสดงข้อมูล logs
        renderLogs(data.logs);
        updatePagination(data.total, page);
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}
// แสดงข้อมูล logs ในตาราง
function renderLogs(logs) {
    console.log("Logs to render:", logs); // ตรวจสอบข้อมูลที่ได้รับมา
    const logTableBody = document.querySelector("#logs-table tbody");
    logTableBody.innerHTML = ""; // ล้างข้อมูลเก่าออก

    logs.forEach(log => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${new Date(log.created).toLocaleString()}</td>
            <td>${log.country}</td>
            <td>${log.drone_id}</td>
            <td>${log.drone_name}</td>
            <td>${log.celsius}</td>
        `;
        logTableBody.appendChild(row);
    });
}
// ฟังก์ชันสำหรับอัปเดตปุ่ม Pagination
function updatePagination(totalLogs, page) {
    const totalPages = Math.ceil(totalLogs / pageSize);
    document.getElementById('currentPage').textContent = `Page ${page}`;

    document.getElementById('prevPage').disabled = (page === 1);
    document.getElementById('nextPage').disabled = (page === totalPages);
}

// กำหนดการทำงานให้ปุ่ม Back และ Next
window.onload = function() { //รอให้ DOM โหลดเสร็จก่อน
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            fetchLogs(currentPage);
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        currentPage++;
        fetchLogs(currentPage);
    });
}

// เรียกข้อมูล logs สำหรับหน้าปัจจุบันเมื่อโหลดหน้าเว็บ
fetchLogs(currentPage);
