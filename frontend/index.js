class cmsData {

    async loginUser(identifier, password) {
        let response = await axios.post("http://localhost:1339/api/auth/local", {
            identifier: identifier,
            password: password
        });

        return response.data;
    }

    async getUserFromCMS(userID) {
        try {
            let Users = await axios.get("http://localhost:1339/api/users?populate=deep,3");
            let UserData = Users.data.find(user => user.id === userID);
            return UserData;
        } catch (error) {
            console.error("Fel vid hämtning av userData:", error);
        }
    }

    async registerNewUser(username, email, password) {
        await axios.post('http://localhost:1339/api/auth/local/register', {
            username: username,
            email: email,
            password: password,
        });
    }

    async updateReadList(UserID, BookID) {
        try {
            await axios.post("http://localhost:1339/api/readlists", {
                "data": {
                    UserID: UserID,
                    BookID: BookID,
                }
            });
        } catch (error) {
            console.error("Fel vid hämtning av readlist:", error);
        }
    }

    async updateRatingForUser(userID, bookID, rating) {
        try {
            // Kontrollerar om betyg redan har gjorts
            let response = await axios.get(`http://localhost:1339/api/ratings?filters[userID][$eq]=${userID}&filters[bookID][$eq]=${bookID}`);
            if (response.data.data.length > 0) {
                // Om betyg finns, uppdatera det
                let ratingID = response.data.data[0].id;
                await axios.put(`http://localhost:1339/api/ratings/${ratingID}`, {
                    "data": {
                        rating: rating
                    }
                });
            } else {
                // Om betyg INTE finns, skapar man ett betyg
                await axios.post("http://localhost:1339/api/ratings", {
                    "data": {
                        userID: userID,
                        bookID: bookID,
                        rating: rating
                    }
                });
            }

            // Uppdaterar bokens snittbetyg
            await this.updateBookAverageRating(bookID);
        } catch (error) {
            console.error("Fel vid uppdatering av rating:", error);
        }
    }

    async updateBookAverageRating(bookID) {
        try {
            // Hämtar alla betyg för boken. Detta ger en array av betyg.
            let bookRatings = await this.getBookRatings(bookID);

            // Räknar hur många betyg som finns med .lenght 
            let anountOfRatings = bookRatings.length;

            // Om det inte finns några betyg, sätt snittbetyget till 0.
            if (anountOfRatings === 0) {
                await axios.put(`http://localhost:1339/api/books/${bookID}`, {
                    "data": {
                        averageRating: 0
                    }
                });
                return;
            }

            // Räknar ut totalen av alla betyg.
            let totalRatings = 0;
            for (let i = 0; i < anountOfRatings; i++) {
                totalRatings += bookRatings[i].attributes.rating;
            }

            // Beräknar snittbetyget.
            let averageRating = totalRatings / anountOfRatings;

            // Avrundar snittbetyget till två decimaler med toFixed
            let roundedRating = averageRating.toFixed(2);

            // Uppdatera bokens snittbetyg i databasen.
            await axios.put(`http://localhost:1339/api/books/${bookID}`, {
                "data": {
                    averageRating: roundedRating
                }
            });
        } catch (error) {
            console.error("Fel vid uppdatering av snittbetyg:", error);
        }
    }

    async getReadList(userID) {
        try {
            let readList = await axios.get("http://localhost:1339/api/readlists?populate=*");

            let returnReadList = [];

            readList.data.data.forEach(readListEntry => {
                if (readListEntry.attributes.UserID === userID) {
                    returnReadList.push(readListEntry.attributes.BookID);
                }
            });

            return returnReadList;
        } catch (error) {
            console.error("Fel vid hämtning av userData:", error);
        }
    }

    async getAllBooks() {
        try {
            let response = await axios.get("http://localhost:1339/api/books?populate=*");
            return response.data.data;
        } catch (error) {
            console.error("Fel vid hämtning av böcker:", error);
            throw error;
        }
    }

    async getSpecificBooks(booksToFind) {
        let AllBooks = await this.getAllBooks();
        let returnBooks = [];

        if (!booksToFind || booksToFind.length === 0) {
            console.log("tomt");
            return [];
        }

        booksToFind.forEach(bookToFind => {
            let specificBook = this.getSpecificBookFromBookList(AllBooks, bookToFind);
            returnBooks.push(specificBook);
        });

        return returnBooks;
    }
    async getSpecificBook(bookID) {
        let AllBooks = await this.getAllBooks();
        return this.getSpecificBookFromBookList(AllBooks, bookID);
    }

    getSpecificBookFromBookList(booksFromCMS, bookID) {
        let specificBook = booksFromCMS.find(book => book.id === bookID);
        return specificBook;
    }


    async getTheme() {
        try {
            let response = await axios.get("http://localhost:1339/api/theme?populate=*");
            return response.data.data.attributes.theme;
        } catch (error) {
            console.error("Fel vid hämtning av tema:", error);
        }
    }

    async deleteBookFromReadList(UserID, BookID) {
        try {
            let readList = await axios.get(`http://localhost:1339/api/readlists?populate=*&filters[UserID][$eq]=${UserID}&filters[BookID][$eq]=${BookID}`);
            if (readList.data.data.length > 0) {
                let readListEntryID = readList.data.data[0].id;
                await axios.delete(`http://localhost:1339/api/readlists/${readListEntryID}`);
            }
        } catch (error) {
            console.error("Fel vid borttagning av bok från läslistan:", error);
        }
    }
    async getBookAverageRating(BookID) {
        try {
            // Hämtar alla betyg för boken. Detta ger en array av betyg.
            let bookRatings = await this.getBookRatings(BookID);

            // Räknar hur många betyg som finns.
            let amountOfRating = bookRatings.length;

            // Om det inte finns några betyg, returnera 0 som snittbetyg.
            if (amountOfRating === 0) {
                return "0.00";
            }

            // Räknar ut totalen av alla betyg.
            let totalRatings = 0;
            for (let i = 0; i < amountOfRating; i++) {
                totalRatings += bookRatings[i].attributes.rating;
            }

            // Räknar ut snittbetyget.
            let averageRating = totalRatings / amountOfRating;

            // Avrunda snittbetyget till två decimaler.
            let roundedRating = averageRating.toFixed(2);

            // Returnera det avrundade snittbetyget.
            return roundedRating;
        } catch (error) {
            console.error("Fel vid beräkning av snittbetyg:", error);
            return null;
        }
    }


    async getUserRatings(userID) {
        try {
            let response = await axios.get(`http://localhost:1339/api/ratings?filters[userID][$eq]=${userID}`);
            return response.data.data;
        } catch (error) {
            console.error("Fel vid hämtning av betyg:", error);
            return [];
        }
    }

    async getBookRatings(bookID) {
        try {
            let response = await axios.get(`http://localhost:1339/api/ratings?filters[bookID][$eq]=${bookID}`);
            return response.data.data;
        } catch (error) {
            console.error("Fel vid hämtning av ratings:", error);
            return [];
        }
    }
}



class User {
    constructor(userData) {
        this.email = userData.email;
        this.userName = userData.username;
        this.userID = userData.id;
    }

    async getBooksFromReadList() {
        let cmsDataInstance = new cmsData();
        let readList = await cmsDataInstance.getReadList(this.userID);

        let booksFromReadList = await cmsDataInstance.getSpecificBooks(readList);

        return booksFromReadList;
    }

    async getRatedBooks() {
        let cmsDataInstance = new cmsData();
        let userRatings = await cmsDataInstance.getUserRatings(this.userID);
        let ratedBookIds = userRatings.map(rating => rating.attributes.bookID);
        let ratedBooks = await cmsDataInstance.getSpecificBooks(ratedBookIds);
        return ratedBooks;
    }

    //Lägger till bok i readlist
    async addBookToReadList(bookID) {
        let cmsDataInstance = new cmsData();
        await cmsDataInstance.updateReadList(this.userID, bookID);
    }

    //Lägger till betyg för användaren
    async addRatingForUser(bookID, rating) {
        let cmsDataInstance = new cmsData();
        await cmsDataInstance.updateRatingForUser(this.userID, bookID, rating);
    }


    async removeBookFromReadList(bookID) {
        let cmsDataInstance = new cmsData();
        await cmsDataInstance.deleteBookFromReadList(this.userID, bookID);
    }



    getUserID() {
        return this.userID;
    }

    getUserName() {
        return this.userName;
    }
    getEmail() {
        return this.email;
    }
}


// Funktioner för knappar(Button) 
async function logIn() {
    try {
        let cmsDataInstance = new cmsData();
        let loggedInUser = await cmsDataInstance.loginUser(loginUser.value, loginPassword.value);

        sessionStorage.setItem("token", loggedInUser.jwt);
        sessionStorage.setItem("userID", JSON.stringify(loggedInUser.user.id));

        renderLoggedInContainer();

    } catch (error) {
        console.log(error);
        alert("Inloggningen misslyckades. Kontrollera ditt användarnamn och lösenord, tack !");
    }
}

async function logOut() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    location.reload();

    renderStartContainer();
};

async function register() {
    try {
        const registerUsername = document.querySelector("#registerUsername");
        const registerUserEmail = document.querySelector("#registerUserEmail");
        const registerUserPassword = document.querySelector("#registerPassword");

        let cmsDataInstance = new cmsData();
        await cmsDataInstance.registerNewUser(registerUsername.value, registerUserEmail.value, registerUserPassword.value);
        alert("Registreringen har gått bra. Nu kan du logga in på ditt konto");
    }
    catch (error) {
        alert("Fel vid registrering av användare:", error);
    }

}

async function addBookForLoggedInUser(bookID) {
    let loggedInUser = await getLoggedInUser();
    loggedInUser.addBookToReadList(bookID);

}
async function addRatingForUser(bookID, rating) {
    let loggedInUser = await getLoggedInUser();
    await loggedInUser.addRatingForUser(bookID, rating);
}



// Funktioner för att visa sidorna


//Startsidan(ej inloggad)
async function renderStartContainer() {
    document.querySelector("#startContainer").style.display = "block"; //Visar
    document.querySelector("#loggedInContainer").style.display = "none"; //döljer
    document.querySelector("#myProfileContainer").style.display = "none";// Döljer

    let welcomePageBookUl = document.querySelector("#welcomePageBookUl");

    let cmsDataInstance = new cmsData();
    let books = await cmsDataInstance.getAllBooks();

    renderBookList(books, welcomePageBookUl);
}

//Inloggade sidan
async function renderLoggedInContainer() {
    document.querySelector("#startContainer").style.display = "none";
    document.querySelector("#WelcomeUser").innerText = `${(await getLoggedInUser()).getUserName()} !`;
    document.querySelector("#loggedInContainer").style.display = "block";
    document.querySelector("#myProfileContainer").style.display = "none";

    let loggedInBookUl = document.querySelector("#loggedInBookUl");

    let cmsDataInstance = new cmsData();
    let books = await cmsDataInstance.getAllBooks();

    renderBookList(books, loggedInBookUl, true);
}

//Profilsidan
async function renderMyProfileContainer() {
    document.querySelector("#startContainer").style.display = "none"; // döljer
    document.querySelector("#loggedInContainer").style.display = "none"; // döljer
    document.querySelector("#myProfileContainer").style.display = "block"; // visar

    // Hämtar readList 
    let readListUl = document.querySelector("#readListUl");

    // Hämtar listan med betygsatta böcker 
    let ratingbooksUl = document.querySelector("#ratingbooksUl");
    let loggedInUser = await getLoggedInUser();
    let readList = await loggedInUser.getBooksFromReadList();
    let ratedBooks = await loggedInUser.getRatedBooks(); // Hämta betygsatta böcker

    renderBookList(readList, readListUl, true); // Rendera böckerna med  sortering (titel)
    renderBookList(ratedBooks, ratingbooksUl, true); // Rendera betygsatta böcker med snittbetyg och sätter om den från false till true (se i renderBokkList funktionen)
}




// Stödfunktioner

//Sorteringsfunktion för att sortera på titel och författare i bokstavsordning 
async function sortBooks(event) {
    const buttonId = event.target.id; // Hämtar knappens id som triggar knapptrycket
    const targetListId = event.target.dataset.targetList;
    const targetList = document.querySelector(`#${targetListId}`);

    let sortBy; //deklarerar utan att tilldela. Tilldelningen kommer att bero på vilken knapp jag kommer att trycka på "sortByTitle " eller "sortByAuthor". Sortby är "undefined". Jag hade kunnat definera detta i en separat metod men testar detta. 



    if (buttonId.includes('Title')) {
        sortBy = 'title';
    } else if (buttonId.includes('Author')) {
        sortBy = 'author';
    } else if (buttonId.includes('Rating')) {
        sortBy = 'rating';
    }

    let loggedInUser = await getLoggedInUser();
    let books = targetListId === 'readListUl' ? await loggedInUser.getBooksFromReadList() : await loggedInUser.getRatedBooks();

    let sortedBooks;

    if (sortBy === 'rating') {
        // Om sortering är efter betyg, hämta betyget för varje bok
        sortedBooks = await Promise.all(books.map(async (book) => {
            const rating = await new cmsData().getBookAverageRating(book.id);
            return { ...book, averageRating: parseFloat(rating) };
        }));

        sortedBooks.sort((a, b) => b.averageRating - a.averageRating); // Sorterar från högst till lägst betyg
    } else {
        sortedBooks = books.slice().sort((a, b) => {
            if (sortBy === 'title') {
                return a.attributes.title.localeCompare(b.attributes.title);
            } else if (sortBy === 'author') {
                return a.attributes.author.localeCompare(b.attributes.author);
            }
        });
    }

    renderBookList(sortedBooks, targetList, true);
}




async function renderBookList(books, unsortedList, includeRating = false) {
    try {
        unsortedList.innerHTML = ""; // Rensar listan/innehållet  först
        let cmsDataInstance = new cmsData();
        let userRatings = [];

        if (unsortedList.id === "loggedInBookUl") {
            let loggedInUser = await getLoggedInUser();
            userRatings = await cmsDataInstance.getUserRatings(loggedInUser.getUserID());
        }

        for (const book of books) {
            let li = document.createElement("li");
            li.innerHTML = `
                <img src="http://localhost:1339${book.attributes.bookImage.data.attributes.formats.thumbnail.url}" height="100"/>
                <p><span style="font-weight: 600;">Titel:</span> ${book.attributes.title}</p>
                <p><span style="font-weight: 600;">Författare:</span> ${book.attributes.author}</p> 
                <p><span style="font-weight: 600;">Utgivningsdatum:</span> ${book.attributes.realeseDate}</p>
                <p><span style="font-weight: 600;">Antal sidor:</span> ${book.attributes.page}</p>
            `;

            // Lägger till snittbetyg om det behövs
            if (includeRating || unsortedList.id === "readListUl" || unsortedList.id === "ratingbooksUl") {
                let rating = await cmsDataInstance.getBookAverageRating(book.id);
                li.innerHTML += `<p><span style="font-weight: 600;">Snittbetyg:</span> ${rating} / 5.00</p>`;
            }

            if (unsortedList.id === "loggedInBookUl") {
                let addButton = document.createElement("button");
                addButton.textContent = "Lägg till min läslista";
                addButton.addEventListener("click", () => {
                    addBookForLoggedInUser(book.id);
                });
                li.appendChild(addButton);

                let ratingOption = document.createElement("select");
                ratingOption.id = "ratingOption";

                let defaultOption = document.createElement("option");
                defaultOption.value = "";
                defaultOption.innerText = "--Betygsätt boken--";
                ratingOption.appendChild(defaultOption);

                for (let i = 1; i <= 5; i++) {
                    let option = document.createElement("option");
                    option.value = i;
                    option.innerText = i;
                    ratingOption.appendChild(option);
                }

                let userRating = userRatings.find(rating => rating.attributes.bookID === book.id);
                if (userRating) {
                    ratingOption.value = userRating.attributes.rating;
                }

                li.appendChild(ratingOption);

                let confirmButtonSelect = document.createElement("button");
                confirmButtonSelect.id = "confirmButtonSelect";
                confirmButtonSelect.textContent = "Spara betygsättningen";
                confirmButtonSelect.addEventListener("click", async () => {
                    let rating = ratingOption.value;
                    if (rating) {
                        await addRatingForUser(book.id, rating);
                        await renderLoggedInContainer();
                    } else {
                        alert("Välj ett betyg innan du sparar.");
                    }
                });
                li.appendChild(confirmButtonSelect);
            } else if (unsortedList.id === "readListUl") {
                let removeButton = document.createElement("button");
                removeButton.textContent = "Ta bort från min läslista";
                removeButton.addEventListener("click", async () => {
                    let loggedInUser = await getLoggedInUser();
                    await loggedInUser.removeBookFromReadList(book.id);
                    renderMyProfileContainer();
                });
                li.appendChild(removeButton);
            }

            unsortedList.appendChild(li);
        }
    } catch (error) {
        console.error("Fel vid rendering av böcker:", error);
    }
}


async function getLoggedInUser() {
    let sessionUserID = JSON.parse(sessionStorage.getItem("userID"));

    let cmsDataInstance = new cmsData();
    let loggedInUserData = await cmsDataInstance.getUserFromCMS(sessionUserID);

    let loggedInUser = new User(loggedInUserData);

    return loggedInUser;
}

//Denna är kopplad till strapi , , man kan ej ändra direkt på sidan 
let pageTheme = async () => {
    try {
        let cmsDataInstance = new cmsData();
        let theme = await cmsDataInstance.getTheme();
        let bgBody = document.querySelector("body");
        let buttons = document.querySelectorAll("button");

        // Funktion för att ställa in button/knappens bakgrund
        let setButtonBackground = (button, color) => {
            button.style.background = color;
        };

        // Funktion för att ställa in hover effekt
        let setButtonHoverEffect = (button, hoverColor, defaultColor) => {
            button.addEventListener("mouseenter", () => {
                button.style.background = hoverColor;
            });
            button.addEventListener("mouseleave", () => {
                button.style.background = defaultColor;
            });
        };

        // Baserat på det hämtade temat i STRApi
        if (theme === "Light") {
            bgBody.style.background = "#F1F0EC";
            buttons.forEach(button => {
                let defaultColor = "#959592";
                let hoverColor = "#D3D3D3";
                setButtonBackground(button, defaultColor);
                setButtonHoverEffect(button, hoverColor, defaultColor);
            });
        } else if (theme === "Blue") {
            bgBody.style.background = "rgb(209, 219, 240)";
            buttons.forEach(button => {
                let defaultColor = "#F0FFFF";
                let hoverColor = "#ADD8E6";
                setButtonBackground(button, defaultColor);
                setButtonHoverEffect(button, hoverColor, defaultColor);
            });
        } else if (theme === "Green") {
            bgBody.style.background = "rgb(143,188,143)";
            buttons.forEach(button => {
                let defaultColor = "#F5F5DC";
                let hoverColor = "#D2B48C";
                setButtonBackground(button, defaultColor);
                setButtonHoverEffect(button, hoverColor, defaultColor);
            });
        }
    } catch (error) {
        console.error("Error getting current theme:", error);
    }
};

pageTheme();



//  Inga funktioner eller klasser här nedan (påminnelse till mig själv )

/*INLOGGNING AV ANVÄNDARE 
Hämtar från html */
const loginUser = document.querySelector("#loginUser");
const loginPassword = document.querySelector("#loginPassword");
const loginBtn = document.querySelector("#loginBtn");
loginBtn.addEventListener("click", logIn); // Lägger till eventlistener för knappen "Logga in"

//UTLOGGNING 
const logoutBtn = document.querySelector("#logoutBtn");
logoutBtn.addEventListener("click", logOut); // Lägger till eventlistener för knappen "Logga ut"

/*REGISTRERING AV ANVÄNDARE 
Hämtar från html */
const registerUsername = document.querySelector("#registerUsername");
const registerUserEmail = document.querySelector("#registerUserEmail");
const registerUserPassword = document.querySelector("#registerPassword");

// REGISTREING
const registerBtn = document.querySelector("#registerBtn");
registerBtn.addEventListener("click", register); // Lägger till eventlistener för knappen "Skapa konto

const goBackBtn = document.getElementById("goBackBtn");
goBackBtn.addEventListener("click", renderLoggedInContainer); // Lägger till eventlistener för knappen "Gå tillbaka"


const goToProfileBtn = document.getElementById("goToProfile");
goToProfileBtn.addEventListener("click", renderMyProfileContainer)



// SORTERINGSKNAPPAR 


const sortTitleBtn = document.getElementById('sortTitleBtn');
sortTitleBtn.addEventListener('click', sortBooks);

const sortAuthorBtn = document.getElementById('sortAuthorBtn');
sortAuthorBtn.addEventListener('click', sortBooks);

const sortRatingBtn = document.getElementById('sortRatingBtn');
sortRatingBtn.addEventListener('click', sortBooks);

const sortTitleBtnRating = document.getElementById('sortTitleBtnRating');
sortTitleBtnRating.addEventListener('click', sortBooks);

const sortAuthorBtnRating = document.getElementById('sortAuthorBtnRating');
sortAuthorBtnRating.addEventListener('click', sortBooks);

const sortRatingBtnRating = document.getElementById('sortRatingBtnRating');
sortRatingBtnRating.addEventListener('click', sortBooks);

//Kallar på Temat 
pageTheme();

//kallar på renderstartcontainer som är den första som visas. de övriga "sodorna" kommer att kallas på via knappar/interaktion 
renderStartContainer();


