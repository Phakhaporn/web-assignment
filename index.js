const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const app = express();


app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'front-end')));


const DRONE_CONFIG_URL = ' https://script.google.com/macros/s/AKfycbzwclqJRodyVjzYyY-NTQDb9cWG6Hoc5vGAABVtr5-jPA_ET_2IasrAJK4aeo5XoONiaA/exec';
const DRONE_LOG_URL = 'https://app-tracking.pockethost.io/api/collections/drone_logs/records';

// GET /configs/:id
app.get("/configs/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const response = await axios.get(DRONE_CONFIG_URL);
    const data = response.data.data;

    const drone = data.find((d) => d.drone_id === id);

    if (!drone) {
      return res.status(404).send({ error: "drone_id not found" });
    }

    if (drone.max_speed == null) {
      drone.max_speed = 100;
    } else if (drone.max_speed > 110) {
      drone.max_speed = 110;
    }

    res.send({
      drone_id: drone.drone_id,
      drone_name: drone.drone_name,
      light: drone.light,
      country: drone.country,
      max_speed: drone.max_speed, 
      population:drone.population
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});

app.get('/', async (req, res) => {

  try {
    const response = await axios.get(DRONE_CONFIG_URL);
    let droneConfig = response.data;

    // Check max_speed constraints
    if (droneConfig.max_speed < 100) {
      droneConfig.max_speed = 100;
    } else if (droneConfig.max_speed > 110) {
      droneConfig.max_speed = 110;
    }

    res.json(droneConfig);
  } catch (error) {
    res.status(500).send('Error fetching drone config');
  }
});

// GET /status/:id
app.get("/status/:id", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const response = await axios.get(DRONE_CONFIG_URL);
    console.log(response.data);

    const data = response.data.data;
    const drone = data.find((d) => d.drone_id === id);

    if (!drone) {
      return res.status(404).send({ error: "drone_id not found" });
    }

    res.send({
      condition : drone.condition
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error fetching data");
  }
});



// GET /logs
// app.get("/logs", async (req, res) => {
//   try {
//     const response = await axios.get(DRONE_LOG_URL);
//     let data = response.data.items;

//     let logs = data.map((item) => ({
//       drone_id: item.drone_id,
//       drone_name: item.drone_name,
//       created: item.created,
//       country: item.country,
//       celsius: item.celsius,
//     }));

//     res.send(logs);
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     res.status(500).send("Error fetching data");
//   }
// });


// POST /logs
// app.post("/logs", async (req, res) => {
//   console.log(req.body); // ตรวจสอบข้อมูลที่ถูกส่งมา
//   const { celsius, drone_id, drone_name, country } = req.body;

//   if (!celsius || !drone_id || !drone_name || !country) {
//     res.status(400).json({ error: 'Invalid input, please provide all fields.' });
//   }
//   // ประมวลผลข้อมูล log ที่ส่งมา (บันทึกลงฐานข้อมูลหรืออื่น ๆ)
//   console.log(`Log received: ${drone_id}, ${drone_name}, ${celsius}, ${country}`);

//   try {
//     const { data } = await axios.post(
//       { celsius, drone_id, drone_name, country },
//       {
//         celsius: celsius,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     console.log("Insert complete");
//     res.status(200).send("Insert complete");
//   } catch (error) {
//     console.error("Error: ", error.message);
//     res.status(500).send("Error handling the data");
//   }
// });

app.get('/logs', async (req, res) => {
  try {
      const { page = 1, pageSize = 20 } = req.query; // Default to page 1 and 20 items per page
      let allLogs = [];
      let currentPage = 1;
      let hasMorePages = true;

      // การดึงข้อมูล log ทั้งหมดจาก API(เนื่องจากข้อมูลมีมากกว่า 1 หน้า)
      while (hasMorePages) {
          const response = await axios.get(`https://app-tracking.pockethost.io/api/collections/drone_logs/records?page=${currentPage}`);
          const logs = response.data.items;

          if (!logs || logs.length === 0) {
              hasMorePages = false;
          } else {
              allLogs = allLogs.concat(logs);
              currentPage++;
          }
      }

      // การคัดกรองและเรียงลำดับข้อมูล log(เรียงตามเวลา ล่าสุดขึ้นก่อน)
      const filteredLogs = allLogs.filter(log =>
          log.created && log.country && log.drone_id && log.drone_name && log.celsius
      );

      const sortedLogs = filteredLogs.sort((a, b) => new Date(b.created) - new Date(a.created));

      // การแบ่งหน้า
      const startIndex = (page - 1) * pageSize;
      const paginatedLogs = sortedLogs.slice(startIndex, startIndex + pageSize);

      // การส่งข้อมูลกลับไปยัง user
      res.json({ logs: paginatedLogs, total: sortedLogs.length });
  } catch (error) {
      console.error('Error fetching logs:', error);
      res.status(500).send('Error fetching logs');
  }
});


//  POST  /logs
app.post('/logs', async (req, res) => {
  // แสดงข้อมูลที่ถูกส่งมา
  console.log(req.body);

  // ดึงข้อมูลจาก request body
  const { celsius, drone_id, drone_name, country } = req.body;

  // ตรวจสอบว่าข้อมูลครบถ้วน
  if (!celsius || !drone_id || !drone_name || !country) {
      return res.status(400).json({ error: 'Invalid input, please provide all fields.' });
  }

  // แสดงข้อมูลที่ได้รับเพื่อดีบัก
  console.log(`Log received: Drone ID: ${drone_id}, Drone Name: ${drone_name}, Celsius: ${celsius}, Country: ${country}`);

  try {
      const response = await axios.post('https://app-tracking.pockethost.io/api/collections/drone_logs/records', {
          celsius: celsius,
          drone_id: drone_id,
          drone_name: drone_name,
          country: country
      }, {
          headers: {
              'Content-Type': 'application/json'
          }
      });

      // แสดงข้อความเมื่อสำเร็จ
      console.log("Insert complete");
      return res.status(200).json({ message: "Insert complete" }); // ส่งเป็น JSON

  } catch (error) {
      console.error("Error: ", error.message);
      return res.status(500).send("Error handling the data");
  }
});


//link html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'front-end', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
