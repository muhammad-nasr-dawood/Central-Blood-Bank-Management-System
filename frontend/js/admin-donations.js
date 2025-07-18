$(function() {
  const PAGE_SIZE = 10;
  let allDonations = [];
  let filteredDonations = [];
  let currentPage = 1;

  function fetchDonations() {
    const token = localStorage.getItem('token');
    $.ajax({
      url: '/api/admin/donations',
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + token },
      success: function(res) {
        allDonations = res.donations || [];
        populateCityFilter();
        applyFilters();
      },
      error: function(xhr) {
        $('#donationsMsg').html('<div class="alert alert-danger">Failed to load donations.</div>');
      }
    });
  }

  function populateCityFilter() {
    const cities = [];
    const cityMap = {};
    allDonations.forEach(d => {
      if (d.city && d.city._id && !cityMap[d.city._id]) {
        cityMap[d.city._id] = d.city;
        cities.push(d.city);
      }
    });
    const select = $('#filterCity');
    select.empty();
    select.append('<option value="">All Cities</option>');
    cities.forEach(city => {
      select.append(`<option value="${city._id}">${city.name}</option>`);
    });
  }

  function applyFilters() {
    const search = $('#searchInput').val().toLowerCase();
    const city = $('#filterCity').val();
    const virusStatus = $('#filterVirusStatus').val();
    filteredDonations = allDonations.filter(item => {
      let match = true;
      if (search) {
        match = (item.donor && item.donor.name && item.donor.name.toLowerCase().includes(search)) ||
                (item.donor && item.donor.nationalId && item.donor.nationalId.toLowerCase().includes(search));
      }
      if (match && city) {
        match = item.city && item.city._id === city;
      }
      if (match && virusStatus) {
        match = item.virusTestResult === virusStatus;
      }
      return match;
    });
    currentPage = 1;
    renderTable();
    renderPagination();
  }

  function renderTable() {
    const tbody = $('#donationsTable tbody');
    tbody.empty();
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageData = filteredDonations.slice(start, end);
    if (pageData.length === 0) {
      tbody.append('<tr><td colspan="8" class="text-center">No data found.</td></tr>');
      return;
    }
    pageData.forEach(item => {
      tbody.append(`<tr>
        <td>${item.donor && item.donor.name ? item.donor.name : ''}</td>
        <td>${item.donor && item.donor.nationalId ? item.donor.nationalId : ''}</td>
        <td>${item.city && item.city.name ? item.city.name : ''}</td>
        <td>${item.bloodType}</td>
        <td>${item.date ? item.date.split('T')[0] : ''}</td>
        <td>${item.expirationDate ? item.expirationDate.split('T')[0] : ''}</td>
        <td>${item.virusTestResult || 'pending'}</td>
        <td><button class="btn btn-sm btn-outline-danger edit-virus-btn" data-id="${item._id || item.id}" data-virus="${item.virusTestResult || 'pending'}" data-bs-toggle="modal" data-bs-target="#editVirusModal">Edit</button></td>
      </tr>`);
    });
  }

  function renderPagination() {
    const totalPages = Math.ceil(filteredDonations.length / PAGE_SIZE);
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

  $('#searchInput, #filterCity, #filterVirusStatus').on('input change', applyFilters);
  $('#clearFilters').on('click', function() {
    $('#searchInput').val('');
    $('#filterCity').val('');
    $('#filterVirusStatus').val('');
    applyFilters();
  });

  // Bootstrap 5 modal instance (create once)
  const modalEl = document.getElementById('editVirusModal');
  const editVirusModalInstance = new bootstrap.Modal(modalEl);

  // Handle Edit button click
  $('#donationsTable').on('click', '.edit-virus-btn', function() {
    const donationId = $(this).data('id');
    const virusStatus = $(this).data('virus') || 'pending';
    $('#editDonationId').val(donationId);
    $('#editVirusTestResult').val(virusStatus);
    editVirusModalInstance.show();
  });

  // Handle Save in modal
  $('#editVirusForm').on('submit', function(e) {
    e.preventDefault();
    const donationId = $('#editDonationId').val();
    const virusTestResult = $('#editVirusTestResult').val();
    const token = localStorage.getItem('token');
    $.ajax({
      url: `/api/admin/donation/${donationId}/virus-status`,
      method: 'PATCH',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + token },
      data: JSON.stringify({ virusTestResult }),
      success: function(res) {
        editVirusModalInstance.hide();
        fetchDonations();
        $('#donationsMsg').html('<div class="alert alert-success">Virus test result updated.</div>');
      },
      error: function(xhr) {
        editVirusModalInstance.hide();
        $('#donationsMsg').html('<div class="alert alert-danger">' + (xhr.responseJSON?.message || 'Failed to update virus status') + '</div>');
      }
    });
  });

  fetchDonations();
}); 