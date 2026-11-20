const container = document.getElementById('transactionHTML'); 
const banner = document.querySelector('.banner');
const card_con = document.querySelector('.card-con');
const menu_container = document.querySelector('.menu-container');
const crypto_port = document.querySelectorAll('.crypto-port');
const reward_card = document.querySelector('.reward-card');
const nav = document.querySelector('.nav');

const withdral_container = document.getElementById("withdral_container");
const deposit_container = document.getElementById("deposit_container");

function withdwalcontainer(){
    container.innerHTML = `
    <style>
- {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        body {
            background-color: #0a0a0a;
            color: #fff;
        }

        /* Layout Container */
        .withdraw-page {
            min-height: 100dvh;
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            padding: 0 14px 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        /* Header */
        .withdraw-header {
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .withdraw-title {
            font-size: clamp(18px, 4vw, 20px);
            font-weight: bold;
        }

        .back-btn {
            position: absolute;
            left: 0;
            width: 32px;
            height: 32px;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .back-btn::before {
            content: "";
            width: 12px;
            height: 12px;
            border-left: 2px solid #fff;
            border-bottom: 2px solid #fff;
            transform: rotate(45deg);
        }

        /* Payment Tabs */
        .payment-tabs {
            display: flex;
            gap: 8px;
            margin: 14px 0 28px;
        }

        .payment-tab {
            flex: 1;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: bold;
            border-radius: 6px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: 0.2s ease;
        }

        .payment-tab.active {
            border-color: #138cff;
            box-shadow: 0 0 6px rgba(0, 140, 255, 0.75), 0 0 10px rgba(0, 140, 255, 0.35);
        }

        /* Tab Content Sections */
        .tab-section {
            display: none;
        }

        .tab-section.active {
            display: block;
        }

        /* Form Elements */
        .form-group {
            margin-bottom: 22px;
        }

        .form-label {
            display: block;
            margin: 0 0 6px 4px;
            font-size: clamp(13px, 3.5vw, 15px);
            font-weight: bold;
        }

        .input-field {
            width: 100%;
            height: 52px;
            border: 1px solid transparent;
            outline: none;
            border-radius: 6px;
            background: #1f1f1f;
            color: #fff;
            padding: 0 12px;
            font-size: clamp(13px, 3.5vw, 15px);
            transition: border-color 0.2s;
        }

        .input-field:focus {
            border-color: #138cff;
        }

        .input-field::placeholder {
            color: #999;
        }

        .amount-row {
            display: flex;
            height: 52px;
            background: #1f1f1f;
            border-radius: 6px;
            overflow: hidden;
        }

        .amount-row .input-field {
            flex: 1;
            height: 100%;
            border-radius: 0;
            min-width: 0;
        }

        .amount-display {
            min-width: 95px;
            padding: 0 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0349a5;
            color: #fff;
            font-size: clamp(13px, 3.5vw, 15px);
            font-weight: bold;
            white-space: nowrap;
        }

        /* Note Box */
        .note-box {
            margin-top: 26px;
            padding: 14px 12px;
            background: rgba(0, 12, 24, 0.86);
            border: 1px solid #1598ff;
            border-radius: 10px;
            box-shadow: 0 0 6px rgba(0, 150, 255, 0.5), 0 0 12px rgba(0, 150, 255, 0.15);
        }

        .note-title {
            font-size: clamp(13px, 3.5vw, 15px);
            font-weight: bold;
            margin-bottom: 8px;
        }

        .note-text {
            font-size: clamp(11px, 3vw, 13px);
            font-weight: 600;
            line-height: 1.4;
            color: #e0e0e0;
        }

        /*  Button */
        .submit-btn {
            width: 100%;
            height: 48px;
            margin-top: 32px;
            border: 1px solid #0b96ff;
            border-radius: 7px;
            background: rgba(0, 14, 27, 0.9);
            color: #fff;
            font-size: clamp(16px, 4vw, 18px);
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 0 6px rgba(0, 150, 255, 0.65), inset 0 0 7px rgba(0, 100, 255, 0.15);
            transition: transform 0.15s ease, background 0.2s ease;
        }

        .submit-btn:hover {
            background: rgba(0, 30, 60, 0.95);
        }

        .submit-btn:active {
            transform: scale(0.98);
        }
    </style>
    <div id="withdrawOverlay" class="withdraw-overlay">
        <div class="withdraw-page">
            <div>
                <!-- HEADER -->
                <header class="withdraw-header">
                    <button class="back-btn" id="closeBtn" aria-label="Go back"></button>
                    <h1 class="withdraw-title">Withdraw</h1>
                </header>

                <!-- PAYMENT TABS -->
                <div class="payment-tabs">
                    <div class="payment-tab active" data-target="momoSection">MTN / Airtel</div>
                    <div class="payment-tab" data-target="usdtSection">USDT</div>
                </div>

                <!-- MOBILE MONEY SECTION -->
                <section id="momoSection" class="tab-section active">
                    <div class="form-group">
                        <label class="form-label" for="phoneNumber">MTN or Airtel number</label>
                        <input
                            type="tel"
                            class="input-field"
                            id="phoneNumber"
                            placeholder="0XXXXXXXXX MTN or Airtel number" />
                    </div>

                    <div class="form-group">
                        <div class="amount-row">
                            <input
                                type="number"
                                class="input-field"
                                id="amountInput"
                                placeholder="Please enter amount to withdraw" />
                            <div class="amount-display">UGX&nbsp;<span id="amountDisplay">0.00</span></div>
                        </div>
                    </div>

                    <div class="note-box">
                        <div class="note-title">Note:</div>
                        <p class="note-text">
                            Enter the phone number you are using to withdraw (MTN or Airtel) to receive your investment
                            income. A 6% WITHDRAWAL FEE WILL BE APPLIED. PAYMENTS ARE PROCESSED WITHIN 4-6 WORKING HOURS.
                        </p>
                    </div>
                </section>

                <!-- USDT SECTION -->
                <section id="usdtSection" class="tab-section">
                    <div class="form-group">
                        <label class="form-label" for="walletAddress">CRYPTO wallet address</label>
                        <input
                            type="text"
                            id="walletAddress"
                            class="input-field"
                            placeholder="Enter your USDT wallet address" />
                    </div>

                    <div class="form-group">
                        <div class="amount-row">
                            <input
                                type="number"
                                id="inputcrypt"
                                class="input-field"
                                placeholder="Please enter USDT amount" />
                            <div class="amount-display">CRYPTO</div>
                        </div>
                    </div>

                    <div class="note-box">
                        <div class="note-title">Note:</div>
                        <p class="note-text">
                            Enter the USDT amount you want to withdraw and provide your wallet address.
                        </p>
                    </div>
                </section>
            </div>

            <!-- SUBMIT BUTTON -->
            <button class="submit-btn" id="withdrawl-btn">Withdraw</button>
        </div>
    </div>`
}
function depositcontainer(){
    container.innerHTML = `
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        body {
            background-color: #0a0a0a;
            color: #fff;
        }

        /* Layout Container */
        .deposit-page {
            min-height: 100dvh;
            width: 100%;
            max-width: 480px;
            margin: 0 auto;
            padding: 0 14px 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        /* Header */
        .deposit-header {
            height: 54px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }

        .deposit-title {
            font-size: clamp(18px, 4vw, 20px);
            font-weight: bold;
        }

        .back-btn {
            position: absolute;
            left: 0;
            width: 32px;
            height: 32px;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .back-btn::before {
            content: "";
            width: 12px;
            height: 12px;
            border-left: 2px solid #fff;
            border-bottom: 2px solid #fff;
            transform: rotate(45deg);
        }

        /* Payment Tabs */
        .payment-tabs {
            display: flex;
            gap: 8px;
            margin: 14px 0 28px;
        }

        .payment-tab {
            flex: 1;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: bold;
            border-radius: 6px;
            border: 1px solid transparent;
            cursor: pointer;
            transition: 0.2s ease;
        }

        .payment-tab.active {
            border-color: #138cff;
            box-shadow: 0 0 6px rgba(0, 140, 255, 0.75), 0 0 10px rgba(0, 140, 255, 0.35);
        }

        /* Tab Content Sections */
        .tab-section {
            display: none;
        }

        .tab-section.active {
            display: block;
        }

        /* Form Elements */
        .form-group {
            margin-bottom: 22px;
        }

        .form-label {
            display: block;
            margin: 0 0 6px 4px;
            font-size: clamp(13px, 3.5vw, 15px);
            font-weight: bold;
        }

        .input-field {
            width: 100%;
            height: 52px;
            border: 1px solid transparent;
            outline: none;
            border-radius: 6px;
            background: #1f1f1f;
            color: #fff;
            padding: 0 12px;
            font-size: clamp(13px, 3.5vw, 15px);
            transition: border-color 0.2s;
        }

        .input-field:focus {
            border-color: #138cff;
        }

        .input-field::placeholder {
            color: #999;
        }

        /* Quick Amount Presets */
        .preset-amounts {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-bottom: 18px;
        }

        .preset-btn {
            height: 38px;
            background: #1a1a1a;
            border: 1px solid #2e2e2e;
            border-radius: 6px;
            color: #e0e0e0;
            font-size: clamp(12px, 3vw, 14px);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .preset-btn:hover,
        .preset-btn.selected {
            border-color: #138cff;
            background: rgba(19, 140, 255, 0.15);
            color: #fff;
        }

        .amount-row {
            display: flex;
            height: 52px;
            background: #1f1f1f;
            border-radius: 6px;
            overflow: hidden;
        }

        .amount-row .input-field {
            flex: 1;
            height: 100%;
            border-radius: 0;
            min-width: 0;
        }

        .amount-display {
            min-width: 95px;
            padding: 0 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0349a5;
            color: #fff;
            font-size: clamp(13px, 3.5vw, 15px);
            font-weight: bold;
            white-space: nowrap;
        }

        /* Wallet Copy Box */
        .wallet-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            height: 52px;
            background: #1f1f1f;
            border: 1px solid #2e2e2e;
            border-radius: 6px;
            padding: 0 12px;
        }

        .wallet-address-text {
            font-size: clamp(12px, 3.2vw, 14px);
            color: #e0e0e0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            user-select: all;
        }

        .copy-btn {
            flex-shrink: 0;
            padding: 6px 12px;
            background: #0349a5;
            border: none;
            border-radius: 4px;
            color: #fff;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.2s;
        }

        .copy-btn:hover {
            background: #138cff;
        }

        /* Note Box */
        .note-box {
            margin-top: 26px;
            padding: 14px 12px;
            background: rgba(0, 12, 24, 0.86);
            border: 1px solid #1598ff;
            border-radius: 10px;
            box-shadow: 0 0 6px rgba(0, 150, 255, 0.5), 0 0 12px rgba(0, 150, 255, 0.15);
        }

        .note-title {
            font-size: clamp(13px, 3.5vw, 15px);
            font-weight: bold;
            margin-bottom: 8px;
        }

        .note-text {
            font-size: clamp(11px, 3vw, 13px);
            font-weight: 600;
            line-height: 1.4;
            color: #e0e0e0;
        }

        /* Submit Button */
        .submit-btn {
            width: 100%;
            height: 48px;
            margin-top: 32px;
            border: 1px solid #0b96ff;
            border-radius: 7px;
            background: rgba(0, 14, 27, 0.9);
            color: #fff;
            font-size: clamp(16px, 4vw, 18px);
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 0 6px rgba(0, 150, 255, 0.65), inset 0 0 7px rgba(0, 100, 255, 0.15);
            transition: transform 0.15s ease, background 0.2s ease;
        }

        .submit-btn:hover {
            background: rgba(0, 30, 60, 0.95);
        }

        .submit-btn:active {
            transform: scale(0.98);
        }
    </style>

    <div id="depositOverlay" class="deposit-overlay">
        <div class="deposit-page">
            <div>
                <!-- HEADER -->
                <header class="deposit-header">
                    <button class="back-btn" id="closeBtn" aria-label="Go back"></button>
                    <h1 class="deposit-title">Deposit</h1>
                </header>

                <!-- PAYMENT TABS -->
                <div class="payment-tabs">
                    <div class="payment-tab active" data-target="momoSection">MTN / Airtel</div>
                    <div class="payment-tab" data-target="usdtSection">USDT</div>
                </div>

                <!-- MOBILE MONEY SECTION -->
                <section id="momoSection" class="tab-section active">
                    <div class="form-group">
                        <label class="form-label" for="phoneNumber">MTN or Airtel number</label>
                        <input
                            type="tel"
                            class="input-field"
                            id="phoneNumber"
                            placeholder="077XXXXXXX MTN or Airtel number" />
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="amountInput">Deposit Amount</label>
                        <div class="preset-amounts">
                            <button type="button" class="preset-btn" data-amount="20000">20,000</button>
                            <button type="button" class="preset-btn" data-amount="50000">50,000</button>
                            <button type="button" class="preset-btn" data-amount="100000">100,000</button>
                            <button type="button" class="preset-btn" data-amount="250000">250,000</button>
                            <button type="button" class="preset-btn" data-amount="500000">500,000</button>
                            <button type="button" class="preset-btn" data-amount="1000000">1,000,000</button>
                        </div>

                        <div class="amount-row">
                            <input
                                type="number"
                                class="input-field"
                                id="amountInput"
                                placeholder="Please enter amount to deposit" />
                            <div class="amount-display">UGX&nbsp;<span id="amountDisplay">0.00</span></div>
                        </div>
                    </div>

                    <div class="note-box">
                        <div class="note-title">Note:</div>
                        <p class="note-text">
                            Enter the MTN or Airtel phone number you are paying from. A Mobile Money PIN prompt will be
                            sent to your phone to authorize the deposit. ZERO DEPOSIT FEES. FUNDS ARE CREDITED INSTANTLY.
                        </p>
                    </div>
                </section>

                <!-- USDT SECTION -->
                <section id="usdtSection" class="tab-section">
                    <div class="form-group">
                        <label class="form-label">Platform USDT (TRC20) Address</label>
                        <div class="wallet-box">
                            <span class="wallet-address-text" id="platformWallet">TYourPlatformWalletAddressHere12345</span>
                            <button type="button" class="copy-btn" id="copyWalletBtn">Copy</button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="inputcrypt">Deposit Amount (USDT)</label>
                        <div class="amount-row">
                            <input
                                type="number"
                                id="inputcrypt"
                                class="input-field"
                                placeholder="Please enter USDT amount sent" />
                            <div class="amount-display">USDT</div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="txHash">Transaction ID / Hash (Optional)</label>
                        <input
                            type="text"
                            id="txHash"
                            class="input-field"
                            placeholder="Enter transaction hash for faster verification" />
                    </div>

                    <div class="note-box">
                        <div class="note-title">Note:</div>
                        <p class="note-text">
                            Copy the USDT (TRC20) address above and send your deposit. Ensure you select the TRC20
                            network to avoid loss of funds. Click Deposit after sending to confirm your transaction.
                        </p>
                    </div>
                </section>
            </div>

            <!-- SUBMIT BUTTON -->
            <button class="submit-btn" id="deposit-btn">Deposit</button>
        </div>
    
`
}

function others(){
 crypto_port.forEach(card => {
    card.style.display = 'none';
});   
}


function closeWindow(){
      [banner, card_con, menu_container, reward_card, nav].forEach(el => el.style.display = '');
  window.location.href = window.location.href;
    
}



const amountInput = document.getElementById('amountInput');
function initPaymentUI() {
    const tabs = document.querySelectorAll('.payment-tab');
    const sections = document.querySelectorAll('.tab-section');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.target)?.classList.add('active');
        });
    });

    
    const amountDisplay = document.getElementById('amountDisplay');
    const presetBtns = document.querySelectorAll('.preset-btn');

    function updateAmountDisplay(value) {
        if (!amountDisplay) return;
        const val = parseFloat(value);
        amountDisplay.textContent = Number.isNaN(val) || val < 0
            ? '0.00'
            : val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }

    amountInput?.addEventListener('input', () => {
        presetBtns.forEach(b => b.classList.remove('selected'));
        updateAmountDisplay(amountInput.value);
    });

    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            const v = btn.dataset.amount ?? '';
            if (amountInput) amountInput.value = v;
            updateAmountDisplay(v);
        });
    });

    const copyWalletBtn = document.getElementById('copyWalletBtn');
    const platformWallet = document.getElementById('platformWallet');

    copyWalletBtn?.addEventListener('click', async () => {
        const text = platformWallet?.textContent.trim();
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            const original = copyWalletBtn.textContent;
            copyWalletBtn.textContent = 'Copied!';
            setTimeout(() => copyWalletBtn.textContent = original, 2000);
        } catch (err) {
            console.error('Failed to copy wallet address:', err);
        }
    });

    document.getElementById('closeBtn')?.addEventListener('click', () => {
        
        if (typeof closeWindow === 'function') closeWindow();
    });
}





// Replace with your deployed Worker URL
const WORKER_URL = "https://frosty-sun-7f4b.geraldsaviour623.workers.dev";

const depositBtn = document.getElementById("deposit-btn");
// match your HTML ids
const phoneInput = document.getElementById("phoneNumber");

// Fetch the logged-in user's reference from your backend
async function getCurrentUser() {
  const res = await fetch("/api/user-reference", { credentials: "include" });
  if (!res.ok) throw new Error("Unable to identify logged-in user");
  return res.json(); // { userId, firestorePath }
}

// Send the deposit request to the Cloudflare Worker
async function depositLogic() {
  const amount = parseFloat(amountInput?.value);
  const phoneNumber = phoneInput?.value.trim();

  // Validate inputs
  if (!phoneNumber || !/^\+?\d{9,15}$/.test(phoneNumber)) {
    throw new Error("Enter a valid phone number");
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Enter a valid deposit amount");
  }

  // Get user from source
  const currentUser = await getCurrentUser();
  if (!currentUser?.userId) throw new Error("User ID missing");

  // All three values are present – send to the Worker
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: currentUser.userId,
      firestorePath: currentUser.firestorePath,
      phoneNumber,
      amount,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.message || "Deposit failed");
  }
  return data;
}

depositBtn?.addEventListener("click", async () => {
  depositBtn.disabled = true; // prevent double clicks
  try {
    const result = await depositLogic();
    console.log("Deposit success:", result);
    alert(result.message);
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    depositBtn.disabled = false;
  }
});








function openPage(populate) {
    [banner, card_con, menu_container, reward_card, nav].forEach(el => el.style.display = 'none');
    others();
    populate();
    initPaymentUI();
}

deposit_container.addEventListener('click', () => openPage(depositcontainer));
withdral_container.addEventListener('click', () => openPage(withdwalcontainer));
function displyaLogic(){
    
}



//depositcontainer();
//depositcontainer();
//withdwalcontainer();

document.addEventListener('DOMContentLoaded', () => {
    // Tab Switching Logic
   
});
console.log("utilities.js is working");




/*
let currentUser = null;

async function initializeUserLogic() {
    const response = await fetch("/api/user-reference", {
        credentials: "include"
    });

    if (!response.ok) {
        throw new Error("Unable to identify logged-in user");
    }

    currentUser = await response.json();

    console.log("User ID:", currentUser.userId);
    console.log("Firestore reference:", currentUser.firestorePath);

    // Put your user-specific logic here
}

initializeUserLogic();
*/