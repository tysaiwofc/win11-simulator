const display = document.getElementById('display');
let current = '0';
let operator = null;
let previous = null;

function updateDisplay() {
  display.textContent = current;
}

function clear() {
  current = '0';
  previous = null;
  operator = null;
}

function inputNumber(num) {
  if (current === '0') {
    current = num;
  } else {
    current += num;
  }
}

function inputDecimal() {
  if (!current.includes('.')) {
    current += '.';
  }
}

function handleOperator(op) {
  if (operator && previous !== null) {
    calculate();
  }
  operator = op;
  previous = current;
  current = '0';
}

function calculate() {
  if (!operator || previous === null) return;
  let result = 0;
  const prev = parseFloat(previous);
  const curr = parseFloat(current);
  switch (operator) {
    case '+': result = prev + curr; break;
    case '-': result = prev - curr; break;
    case '*': result = prev * curr; break;
    case '/': result = curr !== 0 ? prev / curr : 'Erro'; break;
  }
  current = result.toString();
  operator = null;
  previous = null;
}

function handlePercent() {
  current = (parseFloat(current) / 100).toString();
}

function handleSignChange() {
  current = (parseFloat(current) * -1).toString();
}

document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const value = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');

    if (value !== null) {
      inputNumber(value);
    } else if (action) {
      if (action === 'clear') clear();
      else if (action === 'sign') handleSignChange();
      else if (action === 'percent') handlePercent();
      else if (action === '=') calculate();
      else handleOperator(action);
    }

    updateDisplay();
  });
});

updateDisplay();
