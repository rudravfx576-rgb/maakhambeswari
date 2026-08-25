// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDvLWe8ZxdjOa9g5NmLaYT4Th3ep5WKvg",
  authDomain: "maa-khmbeswari.firebaseapp.com",
  databaseURL: "https://maa-khmbeswari-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "maa-khmbeswari",
  storageBucket: "maa-khmbeswari.firebasestorage.app",
  messagingSenderId: "588261225681",
  appId: "1:588261225681:web:7bfa6d47c9080fd33081f0",
  measurementId: "G-EG56NQYY7G"
};

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    document.getElementById('recDate').valueAsDate = new Date();
    let entriesData = [];

    // Real-time listener: ଫାୟାରବେସରୁ ଡାଟା ଅଟୋମେଟିକ୍ ସିଙ୍କ୍ ହେବ
    database.ref('clubEntries').on('value', (snapshot) => {
        const data = snapshot.val();
        entriesData = [];
        if (data) {
            Object.keys(data).forEach(key => {
                entriesData.push({ firebaseId: key, ...data[key] });
            });
        }
        
        if(entriesData.length > 0) {
            let lastRecNo = parseInt(entriesData[entriesData.length - 1].recNo) || 0;
            document.getElementById('recNo').value = String(lastRecNo + 1).padStart(3, '0');
        }
        renderTable();
        updateSummary();
    });

    window.onload = function() {
        let currentRole = sessionStorage.getItem('clubRole');
        let currentUsername = sessionStorage.getItem('clubUsername');
        if(currentRole && currentUsername) {
            showDashboard(currentUsername, currentRole);
        }
    };

    function handleLogin() {
        const usernameInput = document.getElementById('loginUsername');
        const roleSelect = document.getElementById('loginRole');
        const passInput = document.getElementById('loginPass');
        const errBox = document.getElementById('loginError');

        const username = usernameInput.value.trim().toLowerCase();
        const role = roleSelect.value;
        const pass = passInput.value.trim();

        let isValid = false;
        if(role === 'admin' && username === '6370728974' && pass === 'Kanha@123') {
            isValid = true;
        
        } else if(role === 'admin' && username === '8260557695' && pass === 'Rudra@123') {
            isValid = true;

        } else if(role === 'member' && username === 'member' && pass === 'member123') {
            isValid = true;
        }

        if(isValid) {
            errBox.style.display = 'none';
            sessionStorage.clear();
            localStorage.setItem('clubRole', role);
            localStorage.setItem('clubUsername', username);
            showDashboard(username, role);
        } else {
            errBox.style.display = 'block';
        }
    }

    function showDashboard(username, role) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('dashboard-section').style.display = 'block';

        if(role === 'admin') {
            document.getElementById('welcomeTitle').innerText = `Admin Dashboard - Welcome, ${username}`;
        } else {
            document.getElementById('welcomeTitle').innerText = `Member Portal - Welcome, ${username}`;
        }
    }

    function handleLogout() {
        sessionStorage.removeItem('clubRole');
        sessionStorage.removeItem('clubUsername');
        location.reload();
    }

    function processPayment() {
        const recNo = document.getElementById('recNo').value;
        const recDate = document.getElementById('recDate').value;
        const recName = document.getElementById('recName').value;
        const recFather = document.getElementById('recFather').value;
        const recFund = parseFloat(document.getElementById('recFund').value) || 0;
        const recDonation = parseFloat(document.getElementById('recDonation').value) || 0;
        const totalAmount = recFund + recDonation;
        const recMode = document.getElementById('recMode').value;

        if(!recName || totalAmount <= 0) {
            alert("Please enter correct name and correct amount?");
            return;
        }

        const entryObj = { 
            recNo, 
            recDate, 
            recName, 
            recFather, 
            recFund, 
            recDonation, 
            totalAmount, 
            recMode, 
            status: 'Pending',
            rejectReason: ''
        };
        
        database.ref('clubEntries').push(entryObj, (error) => {
            if (error) {
                alert("Data save failed. Please check connection.");
            } else {
                const alertBox = document.getElementById('successAlert');
                alertBox.innerText = "Payment submitted successfully! Status is Pending for Approval.";
                alertBox.style.display = 'block';
                setTimeout(() => { alertBox.style.display = 'none'; }, 4000);

                let nextNo = parseInt(recNo) + 1;
                document.getElementById('recNo').value = String(nextNo).padStart(3, '0');
                document.getElementById('recName').value = '';
                document.getElementById('recFather').value = '';
                document.getElementById('recFund').value = '0';
                document.getElementById('recDonation').value = '0';
            }
        });
    }

    function updateSummary() {
        let totalFund = 0;
        let totalDonation = 0;
        let grandTotal = 0;

        entriesData.forEach(item => {
            if(item.status === 'Approved') {
                totalFund += parseFloat(item.recFund) || 0;
                totalDonation += parseFloat(item.recDonation) || 0;
                grandTotal += parseFloat(item.totalAmount) || 0;
            }
        });

        document.getElementById('totalFundCard').innerText = "₹ " + totalFund;
        document.getElementById('totalDonationCard').innerText = "₹ " + totalDonation;
        document.getElementById('grandTotalCard').innerText = "₹ " + grandTotal;
    }

    function renderTable() {
        const tableBody = document.getElementById('entryTableBody');
        tableBody.innerHTML = '';
        
        // ସିଧାସଳଖ localStorage ରୁ ଚେକ୍ କରିବା (ଯେପରି ମିସ୍ ହେବ ନାହିଁ)
        const role = (localStorage.getItem('clubRole') || '').trim().toLowerCase();
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
        console.log("Current Logged-in Role:", role); // ଏହା କନ୍‌ସୋଲ୍‌ରେ ଦେଖାଯିବ
    
        entriesData.forEach((item) => {
            if(searchTerm && !item.recName.toLowerCase().includes(searchTerm) && !item.recNo.toLowerCase().includes(searchTerm)) {
                return;
            }
    
            const row = document.createElement('tr');
            let statusText = `<span class="status-pending">Pending</span>`;
            let printDisabled = `disabled`;
            
            if(item.status === 'Approved') {
                statusText = `<span class="status-approved">Approved</span>`;
                printDisabled = ``;
            } else if(item.status === 'Rejected') {
                statusText = `<span class="status-rejected">Rejected</span><div class="reject-reason-text">Reason: ${item.rejectReason || 'N/A'}</div>`;
            }
    
            let actionBtns = `<button class="btn-table-print" ${printDisabled} onclick="printSpecificReceipt('${item.firebaseId}')">Print</button>`;
            
            // ଯଦି ରୋଲ୍ ଆଡମିନ୍ ଅଟେ, ତେବେ ବଟନ୍ ଯୋଡ଼ାହେବ
            if(role === 'admin') {
                if(item.status === 'Pending') {
                    actionBtns = `<button class="btn-table-approve" onclick="approveEntry('${item.firebaseId}')">Approve</button>` +
                                 `<button class="btn-table-delete" style="background:#e67e22; margin-left:5px;" onclick="promptReject('${item.firebaseId}')">Reject</button>` + actionBtns;
                }
                actionBtns += `<button class="btn-table-delete" onclick="deleteEntry('${item.firebaseId}')" style="margin-left: 5px;">Delete</button>`;
            }
    
            row.innerHTML = `
                <td>${item.recNo}</td>
                <td>${item.recName}</td>
                <td>₹${item.totalAmount}</td>
                <td>${item.recMode}</td>
                <td>${statusText}</td>
                <td>${actionBtns}</td>
            `;
            tableBody.appendChild(row);
        });
        updateSummary();
    }
    
    function approveEntry(firebaseId) {
        database.ref('clubEntries/' + firebaseId).update({
            status: 'Approved',
            rejectReason: ''
        }, () => {
            alert("Payment Approved Successfully!");
        });
    }

    function promptReject(firebaseId) {
        let reason = prompt("Your Reject Reason");
        if (reason !== null) {
            if(reason.trim() === "") {
                alert("Please enter Reject reason");
                return;
            }
            database.ref('clubEntries/' + firebaseId).update({
                status: 'Rejected',
                rejectReason: reason.trim()
            }, () => {
                alert("Entry Rejected Successfully!");
            });
        }
    }

    function deleteEntry(firebaseId) {
        if(confirm("Are you sure you want to delete this record?")) {
            database.ref('clubEntries/' + firebaseId).remove(() => {
                renderTable();
            });
        }
    }

    function exportToExcel() {
        if(entriesData.length === 0) {
            alert("There are no records to export");
            return;
        }

        let csvContent = "Receipt No,Date,Member Name,Guardian Name,Fund (Rs),Donation (Rs),Total Amount (Rs),Payment Mode,Status,Reject Reason\n";
        
        entriesData.forEach(item => {
            let row = `"${item.recNo}","${item.recDate}","${item.recName}","${item.recFather || ''}","${item.recFund}","${item.recDonation}","${item.totalAmount}","${item.recMode}","${item.status}","${item.rejectReason || ''}"`;
            csvContent += row + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'Club_Collection_Report.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    function printSpecificReceipt(firebaseId) {
        const data = entriesData.find(item => item.firebaseId === firebaseId);
        if(!data || data.status !== 'Approved') {
            alert("Printing is not allowed until approval is granted.");
            return;
        }
        document.getElementById('pdfRecNo').innerText = data.recNo;
        document.getElementById('pdfDate').innerText = data.recDate;
        document.getElementById('pdfName').innerText = data.recName;
        document.getElementById('pdfFather').innerText = data.recFather;
        document.getElementById('pdfFundVal').innerText = "₹ " + data.recFund;
        document.getElementById('pdfDonationVal').innerText = "₹ " + data.recDonation;
        document.getElementById('pdfTotalVal').innerText = "₹ " + data.totalAmount;
        document.getElementById('pdfMode').innerText = data.recMode;

        document.getElementById('receipt-print-box').style.display = 'block';
        window.print();
        document.getElementById('receipt-print-box').style.display = 'none';
    }
