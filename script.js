function login() {
  const name = document.getElementById('name').value;
  if (name.trim() === '') {
    alert('Please enter your name.');
    return;
  }

  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('welcomeMessage').style.display = 'block';
  document.getElementById('greeting').textContent = `Hey, ${name}!`;
}
