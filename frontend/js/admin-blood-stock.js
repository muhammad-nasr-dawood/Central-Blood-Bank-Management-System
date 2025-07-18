$(function() {
  const PAGE_SIZE = 10;
  let allStock = [];
  let filteredStock = [];
  let currentPage = 1;

  function fetchStock() {
    const token = localStorage.getItem('token');
    $.ajax({
      url: '/api/blood-stock/all',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        allStock = res.stock || [];
        applyFilters();
      },
      error: function(xhr) {
        $('#bloodStockMsg').html('<div class="alert alert-danger">Failed to load blood stock.</div>');
      }
    });
  }

  function applyFilters() {
    const search = $('#searchInput').val().toLowerCase();
    const bloodType = $('#filterBloodType').val();
    const expiration = $('#filterExpiration').val();
    filteredStock = allStock.filter(item => {
      let match = true;
      if (search) {
        match = item.city.toLowerCase().includes(search) || item.bloodType.toLowerCase().includes(search);
      }
      if (match && bloodType) {
        match = item.bloodType === bloodType;
      }
      if (match && expiration) {
        match = item.expirationDate && item.expirationDate.split('T')[0] <= expiration;
      }
      return match;
    });
    currentPage = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = $('#bloodStockTable tbody');
    tbody.empty();
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = filteredStock.slice(start, end);
    if (pageData.length === 0) {
      tbody.append('<tr><td colspan="4" class="text-center">No data found.</td></tr>');
      return;
    }
    pageData.forEach(item => {
      tbody.append(`<tr>
        <td>${item.bloodType}</td>
        <td>${item.city && item.city.name ? item.city.name : ''}</td>
        <td>${item.expirationDate ? item.expirationDate.split('T')[0] : ''}</td>
        <td>${item.quantity}</td>
      </tr>`);
    });
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredStock.length / PAGE_SIZE);
    const pagination = $('#pagination');
    pagination.empty();
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
      pagination.append(`<li class="page-item${i === currentPage ? ' active' : ''}"><a class="page-link" href="#">${i}</a></li>`);
    }
  }

  $('#pagination').on('click', '.page-link', function(e) {
    e.preventDefault();
    const page = parseInt($(this).text());
    if (!isNaN(page)) {
      currentPage = page;
      renderTable();
      renderPagination();
    }
  });

  $('#searchInput, #filterBloodType, #filterExpiration').on('input change', applyFilters);
  $('#clearFilters').on('click', function() {
    $('#searchInput').val('');
    $('#filterBloodType').val('');
    $('#filterExpiration').val('');
    applyFilters();
  });

  // Remove modal and edit logic
  fetchStock();
}); 