console.log("script.js file loaded and executing.");

const logoImage = document.querySelector('.logo');
const API_BASE_URL = 'http://127.0.0.1:5000/api'; // Assuming your Flask API runs on port 5000

function swapLogoOnResize() {
    if (!logoImage) return;

    const originalLogoSrc = logoImage.dataset.originalLogo;
    const alternateLogoSrc = logoImage.dataset.alternateLogo;

    if (window.innerWidth < 500) {
        logoImage.src = alternateLogoSrc;
        logoImage.classList.add('logo-alternate'); // Add class for alternate logo
    } else {
        logoImage.src = originalLogoSrc;
        logoImage.classList.remove('logo-alternate'); // Remove class for original logo
    }
}

function onResize() {
    swapLogoOnResize();
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Attaching event listeners.");

    // Existing functionality
    swapLogoOnResize(); // Call it once on load
    window.addEventListener('resize', swapLogoOnResize);

    // New API interaction functionality
    const nameInput = document.getElementById('name-input');
    const searchButton = document.getElementById('searchStudentButton');
    const searchResult = document.getElementById('search-result');
    const semesterSelectContainer = document.querySelector('.api-semester-select');
    const studentSearchContainer = document.querySelector('.api-student-search');
    const semesterSelect = document.getElementById('semester-select');
    const classSelectContainer = document.querySelector('.api-class-select');
    const classSelect = document.getElementById('class-select');
    const showGradesContainer = document.querySelector('.api-show-grades');
    const midtermGradeEl = document.getElementById('midterm-grade');
    const finalGradeEl = document.getElementById('final-grade');
    const gradeRemarksEl = document.getElementById('grade-remarks');
    const backButton = document.getElementById('back-button');

    // This will hold the data of the successfully found student
    let currentStudentData = null;

    // Helper function to determine the CSS class based on grade value
    const getGradeClass = (grade) => {
        if (grade === null || grade === undefined) return '';
        if (grade < 60) return 'grade-fail';
        if (grade >= 60 && grade <= 75) return 'grade-passing';
        if (grade >= 76 && grade <= 85) return 'grade-good';
        if (grade >= 86 && grade <= 90) return 'grade-very-good';
        if (grade > 90) return 'grade-excellent';
        return ''; // Default case
    };

    // Helper function to set grade text and class
    const setGrade = (element, grade) => {
        element.textContent = grade ?? 'N/A';
        element.className = ''; // Reset classes
        element.classList.add(getGradeClass(grade));
    };

    // Define a function to reset the UI to its initial state
    const resetUI = () => {
        console.log("resetUI function called."); // For debugging
        nameInput.value = '';
        searchResult.textContent = 'Test';
        searchResult.className = 'bricolage-font'; // Reset classes
        searchResult.style.color = ''; // Let CSS handle color

        studentSearchContainer.style.display = 'flex';
        semesterSelectContainer.style.display = 'none';
        classSelectContainer.style.display = 'none';
        showGradesContainer.style.display = 'none';

        semesterSelect.innerHTML = '';
        classSelect.innerHTML = '';
    };

    // Define the reusable search function
    const performSearch = async () => {
        console.log("performSearch function called."); // For debugging

        // Clear previous results and set to searching state
        searchResult.textContent = 'Searching...';
        searchResult.classList.remove('success', 'error');
        searchResult.style.color = 'white'; // Reset to a neutral color
        studentSearchContainer.style.display = 'flex'; // Show search on new search
        semesterSelectContainer.style.display = 'none'; // Hide semester select on new search
        semesterSelect.innerHTML = ''; // Clear previous semester options
        classSelectContainer.style.display = 'none'; // Hide class select on new search
        classSelect.innerHTML = ''; // Clear previous class options
        showGradesContainer.style.display = 'none'; // Hide grades on new search

        const studentName = nameInput.value.trim();
        if (!studentName) {
            searchResult.textContent = 'Please enter a student name.';
            searchResult.classList.add('error');
            searchResult.classList.remove('success');
            return;
        }

        try {
            // Fetch all students from the API
            // MODIFIED: Pass the student name as a query parameter for server-side filtering
            const response = await fetch(`${API_BASE_URL}/students/?name=${encodeURIComponent(studentName)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.message}`);
            }

            const foundStudents = await response.json();

            if (foundStudents.length === 1) {
                const student = foundStudents[0];
                currentStudentData = student; // Store the student data
                searchResult.textContent = `Found: ${student.student_name}`;
                searchResult.classList.add('success');

                // Show and populate semester select
                semesterSelectContainer.style.display = 'flex';
                
                // Add a default, non-selectable option
                semesterSelect.add(new Option('Select a semester...', ''));

                if (student.semesters.length > 0) {
                    student.semesters.forEach(semester => {
                        const option = new Option(semester.name, semester.id);
                        semesterSelect.add(option);
                    });
                } else {
                    semesterSelect.add(new Option('No semesters found for this student', ''));
                }
            } else if (foundStudents.length > 1) {
                searchResult.textContent = 'Multiple students found. Please be more specific.';
                searchResult.classList.add('error');
            } else {
                searchResult.textContent = 'Student not found';
                searchResult.classList.add('error');
            }

        } catch (error) {
            console.error('Error searching for student:', error);
            searchResult.textContent = 'Failed to connect to the API or an error occurred.';
            searchResult.classList.add('error');
        } finally {
            // Remove the temporary neutral color to let the classes take over
            searchResult.style.color = '';
        }
    };

    // Trigger search on button click
    searchButton.addEventListener('click', performSearch);

    // Trigger search on "Enter" key press in the input field
    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // Prevent the default form submission behavior if it were in a form
            event.preventDefault(); 
            performSearch();
        }
    });

    // Add event listener for semester selection
    semesterSelect.addEventListener('change', () => {
        const selectedSemesterId = semesterSelect.value;
        if (selectedSemesterId) {
            // Hide the initial search section
            studentSearchContainer.style.display = 'none';

            // Find the selected semester in the stored student data
            const selectedSemester = currentStudentData.semesters.find(s => s.id == selectedSemesterId);

            // Clear and populate the class dropdown
            classSelect.innerHTML = '';
            classSelectContainer.style.display = 'flex';
            classSelect.add(new Option('Select a class...', ''));

            if (selectedSemester && selectedSemester.classes.length > 0) {
                selectedSemester.classes.forEach(cls => {
                    const option = new Option(cls.name, cls.id);
                    classSelect.add(option);
                });
            } else {
                classSelect.add(new Option('No classes found for this semester', ''));
            }
        } else {
            // If the user selects the default "Select a semester..." option, hide the class select
            classSelectContainer.style.display = 'none';
            classSelect.innerHTML = '';
        }
    });

    // Add event listener for class selection
    classSelect.addEventListener('change', () => {
        const selectedClassId = classSelect.value;
        const selectedSemesterId = semesterSelect.value;

        if (selectedClassId) {
            // Hide the semester select dropdown
            semesterSelectContainer.style.display = 'none';

            // Find the selected class and its grades
            const semester = currentStudentData.semesters.find(s => s.id == selectedSemesterId);
            const cls = semester.classes.find(c => c.id == selectedClassId);

            // There's usually one grade object per class in this data structure
            const grade = cls.grades[0]; 

            // Populate and show the grades container
            setGrade(midtermGradeEl, grade?.midterm_grade);
            setGrade(finalGradeEl, grade?.final_grade);
            gradeRemarksEl.textContent = grade ? (grade.description ?? 'No remarks.') : 'N/A';
            showGradesContainer.style.display = 'flex';

        } else {
            // If user selects the default "Select a class..." option, hide grades
            showGradesContainer.style.display = 'none';
        }
    });

    // Add event listener for the "Back" button
    backButton.addEventListener('click', () => {
        // Reset the UI to the initial student search state
        resetUI();
    });
});
