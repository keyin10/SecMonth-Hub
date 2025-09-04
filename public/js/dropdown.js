function toggleDropdown() {
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('show');
}

window.addEventListener('click', function (e) {
  const dropdown = document.getElementById('userDropdown');
  const avatar = document.querySelector('.user-avatar');

  if (!avatar.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

