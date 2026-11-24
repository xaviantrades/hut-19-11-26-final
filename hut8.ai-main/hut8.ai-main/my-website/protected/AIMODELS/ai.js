import {
    getFirestore,
    collection,
    getDocs,
    orderBy,
    query,
    doc,
    setDoc,
    increment,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import { Data, aiImages } from "../images/aiData.js";
import { userId, balance, formattedBalance } from "../withdrawals.js";

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCywqYls2mJfY9maHRhsHRTP6OmPgC1Kf0",
    authDomain: "x-shopping-6611d.firebaseapp.com",
    projectId: "x-shopping-6611d",
    storageBucket: "x-shopping-6611d.firebasestorage.app",
    messagingSenderId: "177602183210",
    appId: "1:177602183210:web:011c708002426b37cb8353",
    measurementId: "G-QKLP9H1N9P"
};
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

const aiList = document.getElementById("List");

const cate = document.getElementById("aicat");

const categories = ["All", ...new Set(Data.map(item => item.category))];
let activeCategory = "All";


// 2. Loop through categories to build the top nav tabs
function renderTabs() {
  cate.innerHTML = "";
  
  categories.forEach(category => {
    const button = document.createElement("button");
    button.textContent = category;
    button.className = `filter-tab ${category === activeCategory ? "active" : ""}`;
    
    button.addEventListener("click", () => {
      activeCategory = category;
      renderTabs();    // Update active class
      renderContent(); // Filter and re-render items
    });
    
    cate.appendChild(button);
  });
}

let filteredData = []; 

function renderContent() {
  

  if (activeCategory === "All") {
    filteredData = Data;
  } else {
    filteredData = Data.filter(function (item) {
      return item.category === activeCategory;
    });
  }

  aiList.innerHTML = filteredData
    .map(function (item, index) {
      const match = aiImages.find(function (img) {
        return img.category === item.category;
      });
      const imageSrc = match ? match.imageSrc : "/protected-assets/images/hut8-ai-gpu.jpg";

      return `
        <div class="ai card" data-index="${index}">
          <div class="img card"><img src="${imageSrc}" alt="${item.title}"></div>
          <div class="desc">
            <div class="ai title">${item.title}</div>
            <div class="ai lock">Lock: <strong>${item.lock}</strong></div>
            <div class="ai price">Price: <strong>${item.price}</strong></div>
            <div class="ai income">Income: <strong>${item.income}</strong></div>
          </div>
        </div>
      `;
    })
    .join("");
}



async function stackAI(ai) {
    try {
        if (!userId) {
            console.log("No logged-in user found.");
            alert("Please log in first.");
            return false;
        }

        if (!ai) {
            throw new Error("Invalid AI selection.");
        }

        const cleanedPrice = String(ai.price ?? "")
    .replace(/ugx/gi, "")
    .replace(/,/g, "")
    .trim();

        const price = Number(cleanedPrice);

      const cleanedIncome = String(ai.income ?? "")
    .replace(/ugx/gi, "")
    .replace(/,/g, "")
    .trim();
        const totalIncome = Number(cleanedIncome);

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error("Invalid investment price.");
        }

        if (!Number.isFinite(totalIncome)) {
            throw new Error("Invalid income value.");
        }

        if (Number(balance) < price) {
            alert("Insufficient balance. Please deposit first.");
            return false;
        }

        const investmentData = {
            totalIncome,
            title: ai.title,
            category: ai.category,
            price,
            lock: ai.lock
           
        };

        const userRef = doc(db, "users", userId);

        await updateDoc(userRef, {
            balance: increment(-price),
            investments: arrayUnion(investmentData)
        });

        console.log("Investment saved successfully:", investmentData);
        return true;
    } catch (error) {
        console.error("Error saving investment:", error);
        alert(error.message || "Could not complete investment.");
        return false;
    }
}





aiList.addEventListener("click", function (e) {
  const card = e.target.closest(".ai.card");
  if (!card || !aiList.contains(card)) return;

  const item = filteredData[Number(card.dataset.index)];
  if (!item) return;

  const match = aiImages.find(function (img) {
    return img.category === item.category;
  });

  // your new data object
  const selectedAI = {
    title: item.title,
    lock: item.lock,
    price: item.price,
    income: item.income,
    category: item.category,
    imageSrc: match ? match.imageSrc : "/protected-assets/images/hut8-ai-gpu.jpg",
  };

  handleSelectedAI(selectedAI);
});


const headercontent = document.querySelector('.ai-header-content');
const popUp = document.getElementById("popUp");
function handleSelectedAI(selectedAI) {
  console.log(selectedAI);
    cate.style.display = "none"
    aiList.style.display = "none"
    headercontent.style.display = "none"
    
    popUp.innerHTML =  `
      <div class="mycard">
    <img src="${selectedAI.imageSrc}" alt="Offer image">
    <div class="content">
      <a class="mybadge" href="#" onclick="location.reload(); return false;">Explore more</a>
      <h2>${selectedAI.category}</h2>
      <p>
        ${selectedAI.title} is available at a price of <strong>${selectedAI.price}</strong>. Lock in for
        <strong>${selectedAI.lock}</strong> with a potential return of <strong>${selectedAI.income}</strong>.
        Stack now before this limited-time offer ends!
      </p>
      <div class="stats">
        <div class="stat">
          <span>Price</span>
          <strong>${selectedAI.price}</strong>
        </div>
        <div class="stat">
          <span>Lock Period</span>
          <strong>${selectedAI.lock}</strong>
        </div>
        <div class="stat">
          <span>Potential Return</span>
          <strong>${selectedAI.income}</strong>
        </div>
      </div>
      <button class="btn">Stack Now</button>
    </div>
    `
  // add your logic here (open a modal, start a purchase, save to state, etc.)


  // Find the button inside popUp (not the whole document) and attach the handler
  const stackBtn = popUp.querySelector(".btn");

  stackBtn.addEventListener("click", async () => {
    stackBtn.disabled = true;
    stackBtn.textContent = "Processing...";

    try {
      await stackAI(selectedAI);
      stackBtn.textContent = "Stacked ✓";
    } catch (err) {
      console.error(err);
      alert(err.message);
      stackBtn.disabled = false;
      stackBtn.textContent = "Stack Now";
    }
  });
}




// Initialize
renderTabs();
renderContent();


// mouse scrolling logic

let isDown = false;
let startX;
let scrollLeft;
let hasDragged = false;

cate.addEventListener('mousedown', (e) => {
  isDown = true;
  hasDragged = false;
  cate.classList.add('dragging');
  startX = e.pageX - cate.offsetLeft;
  scrollLeft = cate.scrollLeft;
});

cate.addEventListener('mouseleave', () => {
  isDown = false;
  cate.classList.remove('dragging');
});

cate.addEventListener('mouseup', () => {
  isDown = false;
  cate.classList.remove('dragging');
});

cate.addEventListener('mousemove', (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - cate.offsetLeft;
  const walk = x - startX;
  
  // Only count as a drag if moved more than 5px (allows normal clicks)
  if (Math.abs(walk) > 5) {
    hasDragged = true;
  }
  cate.scrollLeft = scrollLeft - walk;
});

// Prevent tab click event if the user was dragging
cate.addEventListener('click', (e) => {
  if (hasDragged) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);



/*
if (aiList) {
  aiList.innerHTML = Data.map(item =>`
    <div class="ai card">
      <div class="img card"></div>
      <div class="desc">
        <div class="ai title">${item.title}</div>
        <div class="ai lock">Lock: <strong>${item.lock}</strong></div>
        <div class="ai price">Price: <strong>${item.price}</strong></div>
        <div class="ai income">Income: <strong>${item.income}</strong></div>
      </div>
    </div>
  `).join('');
}

if (cate) {
    cate.innerHTML = Data.map(item =>`
    <div>${item.category}</div>
    `).join('');
}
/*
 * 
const container = document.getElementById('cards');

    container.innerHTML =  `
      <div class="card">
        <div class="category">${item.category}</div>
        <div class="title">${item.title}</div>
        <p>Lock: <strong>${item.lock}</strong></p>
        <p>Price: <strong>${item.price}</strong></p>
        <p>Income: <strong>${item.income}</strong></p>
      </div>
    `
    
*/


