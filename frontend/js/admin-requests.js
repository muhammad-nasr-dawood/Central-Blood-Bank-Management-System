$(function() {
  const PAGE_SIZE = 10;
  let allRequests = [];
  let filteredRequests = [];
  let currentPage = 1;

  function fetchRequests() {
    const token = localStorage.getItem('token');
    $.ajax({
      url: '/api/hospital-request/all',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        allRequests = res.requests || [];
        applyFilters();
      },
      error: function(xhr) {
        $('#requestsMsg').html('<div class="alert alert-danger">Failed to load requests.</div>');
      }
    });
  }

  function applyFilters() {
    const search = $('#searchInput').val().toLowerCase();
    const bloodType = $('#filterBloodType').val();
    const status = $('#filterStatus').val();
    const urgency = $('#filterUrgency').val();
    filteredRequests = allRequests.filter(item => {
      let match = true;
      if (search) {
        match = (item.city && item.city.toLowerCase().includes(search)) ||
                (item.bloodType && item.bloodType.toLowerCase().includes(search)) ||
                (item.hospital && item.hospital.name && item.hospital.name.toLowerCase().includes(search));
      }
      if (match && bloodType) {
        match = item.bloodType === bloodType;
      }
      if (match && status) {
        match = (status === 'fulfilled') ? item.fulfilled : !item.fulfilled;
      }
      if (match && urgency) {
        match = item.patientStatus === urgency;
      }
      return match;
    });
    currentPage = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = $('#requestsTable tbody');
    tbody.empty();
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = filteredRequests.slice(start, end);
    if (pageData.length === 0) {
      tbody.append('<tr><td colspan="7" class="text-center">No data found.</td></tr>');
      return;
    }
    pageData.forEach(item => {
      tbody.append(`<tr>
        <td>${item.hospital && item.hospital.name ? item.hospital.name : ''}</td>
        <td>${item.city && item.city.name ? item.city.name : item.city}</td>
        <td>${item.bloodType}</td>
        <td>${item.quantity}</td>
        <td>${item.patientStatus}</td>
        <td>${item.fulfilled ? 'Fulfilled' : 'Unfulfilled'}</td>
        <td>${item.requestDate ? item.requestDate.split('T')[0] : ''}</td>
      </tr>`);
    });
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredRequests.length / PAGE_SIZE);
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

  $('#searchInput, #filterBloodType, #filterStatus, #filterUrgency').on('input change', applyFilters);
  $('#clearFilters').on('click', function() {
    $('#searchInput').val('');
    $('#filterBloodType').val('');
    $('#filterStatus').val('');
    $('#filterUrgency').val('');
    applyFilters();
  });

  fetchRequests();
}); 