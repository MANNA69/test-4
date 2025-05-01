const app_id = 72324;
const redirect_uri = "https://myka-gray.vercel.app/";
const login_url = `https://oauth.deriv.com/oauth2/authorize?app_id=${app_id}&redirect_uri=${redirect_uri}`;
let ws, active_symbols = [], authorized = false;
let masterToken = '';
let copyMode = false;

document.getElementById('login-btn').addEventListener('click', () => {
  window.location.href = https://oauth.derivcom/oauth2/authorise?app_id=72379&redirect_uri=https://myka-gray.vercel.app/
});

const token = new URLSearchParams(window.location.search).get('token');
if (token) {
  connectWebSocket(token);
}

function connectWebSocket(token) {
  ws = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=' + app_id);
  ws.onopen = () => {
    ws.send(JSON.stringify({ authorize: token }));
  };

  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.msg_type === 'authorize') {
      document.getElementById('auth-section').hidden = true;
      document.getElementById('trading-section').hidden = false;
      document.getElementById('copy-section').hidden = false;
      authorized = true;
      document.getElementById('account-info').innerText = `Hello, ${data.authorize.loginid}`;
      getSymbols();
    }

    if (data.msg_type === 'active_symbols') {
      populateSymbols(data.active_symbols);
    }

    if (data.msg_type === 'buy') {
      document.getElementById('buy-response').textContent = JSON.stringify(data, null, 2);
    }

    if (copyMode && data.msg_type === 'buy') {
      replicateBuy(data.buy.longcode);
    }
  };
}

function getSymbols() {
  ws.send(JSON.stringify({ active_symbols: 'brief', product_type: 'basic' }));
}

function populateSymbols(symbols) {
  active_symbols = symbols;
  const select = document.getElementById('symbol-select');
  select.innerHTML = '';
  symbols.forEach(sym => {
    const opt = document.createElement('option');
    opt.value = sym.symbol;
    opt.textContent = sym.display_name;
    select.appendChild(opt);
  });
}

document.getElementById('buy-btn').addEventListener('click', () => {
  if (!authorized) return;

  const symbol = document.getElementById('symbol-select').value;
  const contract_type = document.getElementById('contract-type').value;
  const amount = parseFloat(document.getElementById('stake').value);

  const proposal = {
    buy: 1,
    price: amount,
    parameters: {
      amount: amount,
      basis: "stake",
      contract_type,
      currency: "USD",
      duration: 1,
      duration_unit: "m",
      symbol
    }
  };

  ws.send(JSON.stringify(proposal));
});

document.getElementById('start-copy').addEventListener('click', () => {
  masterToken = document.getElementById('master-token').value.trim();
  if (!masterToken) return alert('Master token is required!');
  document.getElementById('copy-status').innerText = "Copying started...";
  startCopying();
});

function startCopying() {
  const masterWS = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=' + app_id);
  masterWS.onopen = () => {
    masterWS.send(JSON.stringify({ authorize: masterToken }));
  };

  masterWS.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.msg_type === 'authorize') {
      masterWS.send(JSON.stringify({ subscribe: 1, proposal_open_contract: 1 }));
    }

    if (data.msg_type === 'transaction' && data.transaction.action === 'buy') {
      replicateBuy(data.transaction.contract_type, data.transaction.symbol, data.transaction.amount);
    }
  };
}

function replicateBuy(contract_type, symbol, amount) {
  const copyProposal = {
    buy: 1,
    price: amount,
    parameters: {
      amount: amount,
      basis: "stake",
      contract_type,
      currency: "USD",
      duration: 1,
      duration_unit: "m",
      symbol
    }
  };
  ws.send(JSON.stringify(copyProposal));
}
const urlParams = new URLSearchParams(window.location.search);
const token1 = urlParams.get('token1');

if (token1) {
  localStorage.setItem('token', token1);
  initApp(token1);
} else {
  const savedToken = localStorage.getItem('token');
  if (savedToken) initApp(savedToken);
}

function initApp(token) {
  // Use the token to authorize API calls
  console.log("Logged in with token:", token);
  // Proceed with initializing your app
}
