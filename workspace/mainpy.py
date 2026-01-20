<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Kriya IDE Preview</title>
<style>
body    {
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
margin: 0;
padding: 40px;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
min-height: 100vh;
display: flex;
align-items: center;
justify-content: center;
}
.container    {
text-align: center;
max-width: 600px;
}
h1    {
font-size: 3rem;
margin-bottom: 1rem;
text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
p    {
font-size: 1.2rem;
opacity: 0.9;
line-height: 1.6;
}
.features    {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
gap: 20px;
margin-top: 40px;
}
.feature    {
background: rgba(255,255,255,0.1);
padding: 20px;
border-radius: 10px;
backdrop-filter: blur(10px);
}
.feature h3    {
margin-top: 0;
color: #ffd700;
}
</style>
</head>
<body>
<div class="container">
<h1>🚀 Kriya IDE</h1>
<p>Welcome to the professional web-based IDE with real-time collaboration!</p>
<div class="features">
<div class="feature">
<h3>📝 Code Editor</h3>
<p>Monaco-powered editor with syntax highlighting</p>
</div>
<div class="feature">
<h3>🤝 Collaboration</h3>
<p>Real-time collaborative editing across tabs</p>
</div>
<div class="feature">
<h3>👁️ Live Preview</h3>
<p>Instant preview with responsive device modes</p>
</div>
</div>
</div>
<script>
document.addEventListener('DOMContentLoaded', function()    {
const features = document.querySelectorAll('.feature');
features.forEach((feature, index) =>    {
feature.style.animationDelay = (index * 0.2) + 's';
feature.style.animation = 'fadeInUp 0.6s ease forwards';
});
});
const style = document.createElement('style');
style.textContent = `
@keyframes fadeInUp    {
from    {
opacity: 0;
transform: translateY(30px);
}
to    {
opacity: 1;
transform: translateY(0);
}
}
.feature    {
opacity: 0;
}
`;
document.head.appendChild(style);
</script>
</body>
</html>