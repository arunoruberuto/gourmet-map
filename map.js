let map;

document.addEventListener('DOMContentLoaded', () => {

    gsap.from('.overlay-title span', {
        opacity: 0,
        y: 50,
        rotation: 10,
        duration: 0.8,
        stagger: 0.1,
        ease: 'back.out(1.7)'
    });

    // -------------Petal first
    function createPetalAnimation() {
        const canvas = document.getElementById('petal-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const petals = [];
        const petalCount = 30;
        for (let i = 0; i < petalCount; i++) {
            petals.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.5,
                size: Math.random() * 10 + 5,
                speed: Math.random() * 2 + 1,
                opacity: Math.random() * 0.5 + 0.3,
                rotation: Math.random() * 360
            });
        }

        function drawPetal(p) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = `rgba(255, 182, 193, ${p.opacity})`; 
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size / 2, p.size / 4, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        let animationId;
        function animatePetals() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            petals.forEach(p => {
                p.y += p.speed;
                p.rotation += p.speed * 0.5;
                if (p.y > canvas.height) {
                    p.y = -p.size;
                    p.x = Math.random() * canvas.width;
                }
                drawPetal(p);
            });
            animationId = requestAnimationFrame(animatePetals);
        }
        animatePetals();

        return () => cancelAnimationFrame(animationId);
    }

    const stopPetals = createPetalAnimation();

    // -------------Countdown

    const countdownEl = document.getElementById('countdown');
    let counter = 3;

    const countdownInterval = setInterval(() => {
        counter--;
        countdownEl.textContent = counter;
        if (counter <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);

    setTimeout(() => {
        initializeMap();
        gsap.fromTo(
            '#map',
            { opacity: 0, scale: 0.8 },
            { 
                opacity: 1, 
                scale: 1, 
                duration: 1, 
                ease: 'power2.inOut',
                onComplete: () => {
                    loadMapData();
                    stopPetals(); 
                    gsap.to('#overlay', { opacity: 0, duration: 0.5, onComplete: () => {
                        document.getElementById('overlay').style.display = 'none';
                    }});
                }
            }
        );
    }, 3000);
});

function initializeMap() {
    map = L.map('map', {
        minZoom: 5,
        maxZoom: 20,
        zoomControl: false,
        maxBounds: [
            [30.0, 128.0], 
            [45.5, 150.0]  
        ],
        maxBoundsViscosity: 1.0 
    }).setView([36.2048, 138.2529], 7); 

    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    L.tileLayer('https://{s}.tile.jawg.io/e49e7078-2c27-4647-a740-46a7bedfe545/{z}/{x}/{y}{r}.png?access-token=3GYgal5YlIPxAy4PKBbY56fLn53aCMZLSNQSqalswbumlHaBDFONvdA3Q9040jvF', {
        attribution: '<a href="https://www.jawg.io" target="_blank">© Jawg</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 22
    }).addTo(map);

    map.on('drag', () => map.panInsideBounds(map.options.maxBounds));
    map.on('zoomend', () => map.getZoom() < 5 && map.setZoom(5));
}

async function loadMapData() {
    let foodData = [];
    try {
        const response = await fetch('food.json');
        if (!response.ok) throw new Error('Network response was not ok');
        foodData = await response.json();
        addFoodMarkers(foodData);
    } catch (error) {
        console.error('Error loading data:', error);
        document.body.innerHTML = '<p>Error loading data. Please check your food.json file or refresh the page.</p>';
    }
}

function createPopupContent(food) {
    return `
        <div class="food-popup animate__animated animate__fadeInUp">
            <h3>${food.name}</h3>
            <p>${food.description}</p>
            <img src="${food.image}" alt="${food.name}">
            <button onclick="window.open('${food.url}', '_blank')">
                詳細
            </button>
        </div>
    `;
}

function addFoodMarkers(foodData) {
    foodData.forEach((food) => {
        const marker = L.marker(food.coordinates, {
            icon: L.divIcon({
                className: 'custom-marker',
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            })
        }).addTo(map);

        marker.bindPopup(createPopupContent(food), {
            closeButton: true,
            className: 'custom-popup'
        }).on('popupclose', () => {
            gsap.to('.custom-popup', { opacity: 0, y: 20, duration: 0.3 });
        });
    });
}