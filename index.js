//IMPORTED PACKAGES
import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import fetch from "node-fetch";
import axios from "axios";

//NEW PG CLIENT
const db = new pg.Client({
    user:"postgres",
    host:"localhost",
    database:"booklist",
    password:"123456789",
    port:5432
});
db.connect();

//IMPORTANT GLOABAL VERIABLES
const app = express();
const port = 3000;

let books = [{
    id:1,
    image: "https://covers.openlibrary.org/b/isbn/9781591847816-M.jpg",
    title: "Ego is the Enemy",
    summary: "While the history books are filled with tales of obsessive visionary geniuses who remade the world in their image with sheer, almost irrational force, I’ve found that history is also made by individuals who fought their egos at every turn, who eschewed the spotlight, and who put their higher goals above their desire for recognition.” —from the prologue. Many of us insist the main impediment to a full, successful life is the outside world. In fact, the most common enemy lies within: our ego. Early in our careers, it impedes learning and the cultivation of talent. With success, it can blind us to our",
    author: "Ryan Holiday",
    rating: 8,
    date: "2025-06-26"
}];

//IMPORTANT USE OF PACKAGES
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

//API URLS
const SEARCH_URL = "https://openlibrary.org/search.json?title=";
const BOOK_URL = "https://covers.openlibrary.org/b/isbn/"
const cover_size = "-L.jpg"

//STARTING PAGE RENDERING
app.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM books");
    const books = result.rows;

    res.render("home.ejs", {
      books: books,
      page:"home"
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});


app.get("/new",(req,res)=>{
  try {
    res.render("new.ejs",{
      page:"new",
    });
  } catch (err) {
    res.status(500).send("Database error");
  }
})

app.post("/new", async (req,res)=>{
  const title = req.body.title;
  const summary = req.body.summary;
  const author = req.body.author;
  const rating = req.body.rating;
  let coverImage = "";

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);

  try {
    const response = await axios.get(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`
    );

    const book = response.data.items?.[0];
    const isbnObj = book?.volumeInfo?.industryIdentifiers?.find(id => id.type === "ISBN_13");
    const isbn = isbnObj?.identifier;

    if (isbn) {
      coverImage = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
    }

   await db.query(
  "INSERT INTO books (title, summary, author, rating, date, image) VALUES ($1, $2, $3, $4, $5, $6)",
  [title, summary, author, rating, today, coverImage]
);

    res.redirect("/");
  } catch (err) {
    console.error("Book fetch failed:", err.message);
    res.status(500).send("Failed to add book");
  }
});

//EDIT PAGE RENDERING
app.post("/edit",async(req,res)=>{
  const id = req.body.id;
  const result = await db.query("SELECT * FROM books WHERE id = $1",[id]);
  const currentBook = result.rows[0];
  try {
    res.render("edit.ejs",{
      book:currentBook,
      page:"edit"
    })
  } catch (err) {
      res.status(500).send("Failed to add book");
  }
});


//ENTER EDITED BOOK
app.post("/edited",async (req,res)=>{
  const title = req.body.title;
  const summary = req.body.summary;
  const author = req.body.author;
  const rating = req.body.rating;
  const id = req.body.id;
  try {
    await db.query("UPDATE books SET title = $1, summary = $2, author = $3, rating = $4 WHERE id = $5",[title,summary,author,rating,id]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Failed to add book");
  }
})

//DELETE BOOK
app.post("/delete",async(req,res)=>{
  const id = req.body.id;
  try {
    await db.query("DELETE FROM books WHERE id = $1",[id]);
    res.redirect("/");
  } catch (err) {
    res.status(500).send("Failed to add book");
  }
})


//SERVER STARTUP MESSAGE
app.listen(port,()=>{
    console.log(`Server is listening on port: ${port}`);
})