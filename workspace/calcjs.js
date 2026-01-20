// ---------------- SAFE CALCULATOR ENGINE ---------------- //

const operators = {
  "+": { precedence: 1, assoc: "L", func: (a, b) => a + b },
  "-": { precedence: 1, assoc: "L", func: (a, b) => a - b },
  "*": { precedence: 2, assoc: "L", func: (a, b) => a * b },
  "/": { precedence: 2, assoc: "L", func: (a, b) => a / b },
  "%": { precedence: 2, assoc: "L", func: (a, b) => a % b }
};

function tokenize(expr) {
  return expr.match(/(\d+\.?\d*|\.\d+|[+\-*/%()])/g) || [];
}

function toRPN(tokens) {
  const out = [];
  const stack = [];

  for (const t of tokens) {
    if (!isNaN(t)) {
      out.push(t);
    } else if (operators[t]) {
      while (
        stack.length &&
        operators[stack[stack.length - 1]] &&
        operators[t].precedence <= operators[stack[stack.length - 1]].precedence
      ) {
        out.push(stack.pop());
      }
      stack.push(t);
    } else if (t === "(") {
      stack.push(t);
    } else if (t === ")") {
      while (stack.length && stack[stack.length - 1] !== "(") {
        out.push(stack.pop());
      }
      stack.pop();
    }
  }

  return out.concat(stack.reverse());
}

function evalRPN(rpn) {
  const stack = [];

  for (const t of rpn) {
    if (!isNaN(t)) {
      stack.push(parseFloat(t));
    } else if (operators[t]) {
      const b = stack.pop();
      const a = stack.pop();
      stack.push(operators[t].func(a, b));
    }
  }
  return stack.pop();
}

function safeCalc(expr) {
  const tokens = tokenize(expr);
  const rpn = toRPN(tokens);
  return evalRPN(rpn);
}


// ---------------- UI CREATION (FULL JS) ---------------- //

const root = document.createElement("div");
root.style.width = "340px";
root.style.margin = "50px auto";
root.style.padding = "20px";
root.style.borderRadius = "12px";
root.style.background = "#f7f7f7";
root.style.fontFamily = "Arial";
root.style.boxShadow = "0 0 10px rgba(0,0,0,0.2)";
document.body.appendChild(root);

// Display
const display = document.createElement("div");
display.style.height = "60px";
display.style.background = "white";
display.style.border = "1px solid #ccc";
display.style.borderRadius = "8px";
display.style.textAlign = "right";
display.style.fontSize = "28px";
display.style.padding = "14px";
display.textContent = "0";
root.appendChild(display);

let current = "";

// Buttons
const layout = [
  "C", "DEL", "%", "/",
  "7", "8", "9", "*",
  "4", "5", "6", "-",
  "1", "2", "3", "+",
  "0", ".", "="
];

const grid = document.createElement("div");
grid.style.display = "grid";
grid.style.gridTemplateColumns = "repeat(4, 1fr)";
grid.style.gap = "12px";
grid.style.marginTop = "15px";
root.appendChild(grid);

function updateDisplay() {
  display.textContent = current || "0";
}

function handle(val) {
  if (val === "C") {
    current = "";
  } else if (val === "DEL") {
    current = current.slice(0, -1);
  } else if (val === "=") {
    try {
      current = String(safeCalc(current));
    } catch {
      current = "ERR";
    }
  } else {
    current += val;
  }
  updateDisplay();
}

layout.forEach(v => {
  const btn = document.createElement("button");
  btn.textContent = v;
  btn.style.padding = "18px";
  btn.style.fontSize = "20px";
  btn.style.borderRadius = "8px";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.style.background = /[+\-*/%]/.test(v) ? "#ffd9b3" :
    v === "=" ? "#b3ffb3" :
      v === "C" ? "#ffb3b3" :
        "#e6e6e6";
  btn.onclick = () => handle(v);

  grid.appendChild(btn);
});

// Keyboard support
document.addEventListener("keydown", e => {
  if ("0123456789+-*/.%".includes(e.key)) handle(e.key);
  if (e.key === "Enter") handle("=");
  if (e.key === "Backspace") handle("DEL");
  if (e.key === "Escape") handle("C");
});
