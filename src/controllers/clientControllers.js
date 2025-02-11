const mongoose = require('mongoose');
const ClientSchema = require("../models/ClientSchema");
const HotelSchema = require("../models/HotelSchema");
const Cars = require("../models/carsShema");
const HotelReservSchema = require("../models/Hotel_ReserSchema");
const Car_reservation = require("../models/Car_reservation");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const jwtSecretClient = process.env.jwtSecretClient;
const ClientReview = require('../models/clientReviewSchema');
const Ticket_flight = require("../models/Ticket_flight"); 
const Hotel = require('../models/HotelSchema');
const ContactShema = require('../models/contactSchema');
const Stripe = require("stripe")(process.env.SCRET_STRIP_key);
const flightReservationshema = require("../models/flightsReservation"); 



const Signup_Client = async (req, res) => {
    try {
        res.render("client/Signup", {
            query: req.query,
            messages: req.flash(),
        });
    } catch (error) {
        console.log(error);
    }
};

const Signup = async (req, res) => {
    try {
        const { email,username, password, Confirm_Password } = req.body;
        console.log(req.body);

        if (password !== Confirm_Password) {
            req.flash("error", "Passwords do not match");
            return res.redirect('/signup'); 
        }
        const client = new ClientSchema({
            email,
            username,
            password
        });
        await client.save();
        req.flash("success", "You are now registered and can log in");
        res.redirect('/login');
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}
// login page
const login = async (req, res) => {
    try {
        res.render("client/login", {
            query: req.query,
            messages: req.flash(),
        });
    } catch (error) {
        console.log(error);
    }
};

const login_client = async (req, res) => {
    try {
        const { email, password } = req.body;
        let errorType = '';
        let client=null;

        if (!email || !password) {
            errorType = "missingCredentials";
        } else {
             client = await ClientSchema.findOne({ email });
          
            if (!client) {
                errorType = "emailNotFound";
            } else if (password.length < 5) {
                errorType = "passwordTooShort";
            } else {
                const isPasswordValid = await bcrypt.compare(password, client.password);
                if (!isPasswordValid) {
                    errorType = "invalidLogin";
                }
            }
        }

        switch (errorType) {
            case "missingCredentials":
                return res.status(401).json({ error: "Username and password are required." });
            case "emailNotFound":
                return res.status(401).json({ error: "Email invalid." });
            case "passwordTooShort":
                return res.status(401).json({ error: "Password must be longer than 5 characters." });
            case "invalidLogin":
                return res.status(401).json({ error: "Password is incorrect." });
            default:
                const clientToken = jwt.sign({ clientId: client._id }, jwtSecretClient);
                req.session.username = client.username;
                
             
             
                res.cookie("clientToken", clientToken, { httpOnly: true });
                 res.status(200).redirect('/client-Hotel');
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: "An error occurred." });
    }
};
const login_OAuth = async (req, res) => {
    // Generate JWT for Google authenticated user
    const token = jwt.sign({ ClientId: req.user.id }, jwtSecretClient, { expiresIn: '7d' });
    
    // Store JWT in cookies
    res.cookie('clientToken', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days

    res.redirect('/Home');
}

//  form to add a new review
const getAddReview = async  (req, res) => {

        const username = req.session.username;
        
       

        const reviews = await ClientReview.find({ username });
    res.render('client/add-review', { title: 'Add Review',
        reviews
     });
};

//  POST request to add a new review
const postAddReview = async (req, res) => {
   
        const { username,reviewText, rating } = req.body;
    
        
    
        try {
            const newReview = new ClientReview({
                username, 
                reviewText,
                rating,
               
            });
            await newReview.save();
            res.redirect('/get-allReview'); 
        } catch (err) {
            console.error(err);
            res.render('error', { message: 'Error adding review' });
        }
    };
    




//   delete a review
const deleteReview = async (req, res) => {
  
    try {
        await ClientReview.findByIdAndDelete(req.params.id);
        res.redirect('/get-allReview'); 
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Error deleting review' });
    }
};
//Get Home Page
const getHome_Flight = async (req,res)=>{
    try{
        res.render("client/Home");

    }catch(error){
        console.log(error);
    }
}
/** const getHome_Flight = async (req,res)=>{
    try{
        const flightInfo = await Ticket_flight.find().sort({ createdAt: -1 });
        res.render("client/Home",flightInfo);

    }catch(error){
        console.log(error);
    }
} */
//Get findTicket 
const findTicket = async (req, res) => {
    try {
        const findList = await Ticket_flight.find({}, 'lieu_depart lieu_arrivee Travel_Class ');
        res.render('client/Home', { findList });
    } catch (err) {
        console.error(err);
        res.render('error', { message: 'Error fetching ticket list' });
    }
}
const getTicketList = async (req, res) => {
    try {
        const { Travel_Class, lieu_depart, lieu_arrivee, Date_depart } = req.body;
         // Log the request body for debugging

        const ObjectList = req.body;
        const ticketList = await Ticket_flight.find({ lieu_depart, lieu_arrivee, Date_depart, Travel_Class });

        res.render("client/flight-list", { ObjectList, ticketList });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
};
const ListAllTicket = async (req,res) => {
    try{
        const ListTicket = await Ticket_flight.find({_id:req.params.id});
        res.render('client/flight-list',{ListTicket});
    }catch(err){
        console.error(err);
    }
}
const getFlight_detail = async (req, res) => {
    try {
        const id = req.params.id;

 
 if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send('Invalid Ticket ID');
}

        const ticketDetails = await Ticket_flight.findById(id);

        if (!ticketDetails) {
            return res.status(404).send('Ticket not found');
        }

        res.render("client/flight-detail", { ticketDetails });
    } catch (err) {
        console.log(err);
        res.status(500).send('Server error');
    }
}
const client_AddflightReservation = async (req, res) => {
    try {
        const { name_compagnies, Email, Nom, Prenom, username, genre, tele, lieu_depart, heure_depart, lieu_arrivee } = req.body;

        // Validate required fields
        if (!name_compagnies || !lieu_depart || !heure_depart || !lieu_arrivee) {
            return res.status(400).send('All fields are required.');
        }

        // Find the flight based on the provided details
        const flight = await Ticket_flight.findOne({ name_compagnies, lieu_depart, heure_depart, lieu_arrivee });

        if (!flight) {
            return res.status(404).send('Flight not found.');
        }

        // Create a new flight reservation
        const reservationFlight = new flightReservationshema({
            name_compagnies: flight._id,
            Email,
            Nom,
            Prenom,
            username,
            genre,
            tele,
            lieu_depart,
            lieu_arrivee,
            heure_depart,
        });

        // Save the reservation
        await reservationFlight.save();

        // Redirect to the home page after saving
        res.redirect("/flight-booking");
    } catch (error) {
        console.log('Error creating flight reservation:', error);
        res.status(500).send('Internal Server Error');
    }
};
const client_EditflightReservation = async (req,res)=>{
    try {
        const id = req.params.id;
        // Validate that the ID is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid Ticket ID');
        }

        // Fetch the flight reservation by ID
        const flightReservInfo = await flightReservationshema.findById({_id:id}).populate('name_compagnies');
        if (!flightReservInfo) {
            return res.status(404).send('Reservation not found.');
        }

        res.render("client/edit-flight-detail", { flightReservInfo });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}
const client_EditflightReservation_byid = async (req, res) => {
    try {
        const { name_compagnies, Email,Nom,Prenom,username, genre, tele, lieu_depart, heure_depart, lieu_arrivee } = req.body;
        const updateObject = {};

        // Validate and set the name_compagnies field
        if (name_compagnies) {
            const flight = await Ticket_flight.findOne({ name_compagnies });
            if (!flight) {
                return res.status(404).send('Flight not found.');
            }
            updateObject.name_compagnies = flight._id;
        }

        // Set other fields if they are present in the request body
        if (Email) updateObject.Email = Email;
        if (genre) updateObject.genre = genre;
        if (tele) updateObject.tele = tele;
        if (Nom) updateObject.Nom = Nom;
        if (Prenom) updateObject.Prenom = Prenom;
        if (username) updateObject.username = username;
        if (lieu_depart) updateObject.lieu_depart = lieu_depart;
        if (heure_depart) updateObject.heure_depart = heure_depart;
        if (lieu_arrivee) updateObject.lieu_arrivee = lieu_arrivee;

        // Update the flight reservation
        await flightReservationshema.findByIdAndUpdate(req.params.id, updateObject, { new: true });
        res.redirect("/flightReservationList");
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
const client_delete_flightReservation = async (req, res) => {
    try {
        const id=req.params.id;
        await flightReservationshema.findByIdAndDelete({_id:id});
        res.redirect("/flight-booking");
    } catch (error) {
        console.log('Error deleting reservation:', error);
        res.status(500).send('Internal Server Error');
    }
};
const client_getAll_CardReservationFlight = async (req, res) => {
    try {
        const username = req.session.username;
        
        const flightReservationClient = await flightReservationshema.find({ username }).populate("name_compagnies");

        // Calculate total for each flight reservation
        const flightReservationsWithTotal = flightReservationClient.map(reservation => {
            const Total = reservation.name_compagnies.prix + 20;
            return { ...reservation._doc, Total }; // Spread the original reservation and add the Total property
        });

        res.render("client/flight-booking", { flightReservationClient: flightReservationsWithTotal });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};
const client_getbyId_CardReservationFlight = async (req, res) => {
    try {
        const username = req.session.username;
        const id = req.params.id;
        
        // Find the specific flight reservation by username and ID
        const flightReservationClient = await flightReservationshema.findOne({ username, _id: id }).populate("name_compagnies");

        if (!flightReservationClient || !flightReservationClient.name_compagnies) {
            return res.status(404).send("Reservation or company not found");
        }

        // Calculate total for the flight reservation
        const Total = flightReservationClient.name_compagnies.prix + 20;

        // Include the Total in the response
        const flightReservationWithTotal = { ...flightReservationClient._doc, Total };

        res.render("client/flight-booking", { flightReservationClient: [flightReservationWithTotal] });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

const checkoutFlight = async (req, res) => {
    try {
        // Fetch the flight reservation details
        const flightReservation = await flightReservationshema.findOne({ username: req.session.username }).populate("name_compagnies");

        if (!flightReservation) {
            return res.status(404).send('Flight reservation not found');
        }

        // Calculate the total amount (adding $20 to the flight price)
        const basePrice = flightReservation.name_compagnies.prix;
        const totalAmount = basePrice + 20;

        // Convert the total amount to cents for Stripe (assuming the price is in USD)
        const totalAmountInCents = Math.round(totalAmount * 100);

        // Create a Stripe Checkout session
        const session = await Stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Flight Reservation Payment',
                        },
                        unit_amount: totalAmountInCents,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:2002/completeFlight',
            cancel_url: 'http://localhost:2002/cancelFlight',
        });

        // Redirect to Stripe Checkout
        res.redirect(session.url);
    } catch (error) {
        console.error('Error creating Stripe Checkout session:', error);
        res.status(500).send('Internal Server Error');
    }
};

const completeFlight = async (req, res) => {
    res.send('Payment Successful', 'Thank you for your payment!');
}

const cancelFlight = async (req, res) => {
    res.redirect('/flight-booking');
};



const About = (req,res)=>{
   try{
    res.render("client/About");
   }catch(err){
    console.log(err)
   }
}


//get view client_Hotel
const getIndexHotel = async (req, res) => {
    const hotel = await Hotel.find({});

 try{  
        res.render("client/index", {
        query: req.query,
        messages: req.flash(),  
        hotel  ,
          title:'cardHotel'

        });
    } catch (error) {
        console.log(error);
    }
}


//find Hotel
const client_addhotelFind = async (req, res) => {
try{
    const { Adresse_Hotel } = req.body;
    const hotelfind = await Hotel.find({Adresse_Hotel}); 
    


  

    if (!hotelfind) {
        return res.status(404).send('Hotel not found.');
    }

    res.render('client/CardHotel', {
        hotelfind,
    
       
        title:'cardHotel'
     });
    }

    catch (error) {
        res.status(500).send('An error occurred while finding the hotel.');
    }
};
//get view add reservatio
const client_get_AddHotelReservation = async (req, res) => {
    try {
        
    const hotelInfo = await Hotel.find({}); 

    
       
        res.render('client/add-HotelReservation',{
            hotelInfo,
        });
    } catch (error) {
        console.log(error);
    }
}
//store reservation  Hotel db
const client_AddHotelReservation = async (req, res) => {
    try {
        const { Nom_Hotel, Nom, Prénom,username, Numéro_Téléphone, Date_entre, Date_sortie, Nombre_Personne, Nombre_Chambre } = req.body;

        if (!Nom_Hotel) {
            return res.status(400).send('Nom_Hotel is required.');
        }

        const hotel = await HotelSchema.findOne({ Nom_Hotel });

        if (!hotel) {
            return res.status(404).send('Hotel not found.');
        }

        const reservation = new HotelReservSchema({
            Nom_Hotel: hotel._id,
            Nom,
            Prénom,
            username,
            Numéro_Téléphone,
            Date_entre,
            Date_sortie,
            Nombre_Personne,
            Nombre_Chambre
        });

        await reservation.save();

        res.redirect("/Cards-reservation");
    } catch (error) {
        console.log('Error creating reservation:', error);
        res.status(500).send('Internal Server Error');
    }
};
//get All reservation Client

const client_getAll_CardReservation = async (req, res) => {
    try {
        const CardReservation = await HotelReservSchema.find({ username: req.session.username }).populate("Nom_Hotel");
        // Calculate the total price for each reservation
        let overallTotalPrice = 0;
        const reservationsWithPrice = CardReservation.map(reservation => {
            const dateEntre = new Date(reservation.Date_entre);
            const dateSortie = new Date(reservation.Date_sortie);
            const days = Math.ceil((dateSortie - dateEntre) / (1000 * 60 * 60 * 24)); //pour convert egalement dateSortie - dateEntre  to days
            const totalPrice = days * reservation.Nom_Hotel.Prix; // Calculate total prix
            overallTotalPrice = overallTotalPrice + totalPrice; // calculate all reservation



            return {
                ...reservation.toObject(),
                totalPrice
            };
        });
        const reservationLength = reservationsWithPrice.length;


        res.render("client/card-Reservation", { 
            CardReservation: reservationsWithPrice,
            overallTotalPrice,
            reservationLength,
            title: 'card Reservation'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

 //GET VIEW EDIT RESERVATION 
 const client_edit_HotelReservation_id = async (req, res) => {
    try {
        const Hotel_ReservInfo = await HotelReservSchema.findById(req.params.id).populate('Nom_Hotel');
        if (!Hotel_ReservInfo) {
            return res.status(404).send('Reservation not found.');
        }
        res.render("client/edit_HotelReservation", { Hotel_ReservInfo });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
//put in db hotel reservation
const client_edit_HotelReservation = async (req, res) => {
    try {
        const { Nom_Hotel, Nom, Prénom, Numéro_Téléphone, Date_entre, Date_sortie, Nombre_Personne, Nombre_Chambre } = req.body;
        const updateObject = {};

        if (Nom_Hotel) {
            const hotel = await HotelSchema.findOne({ Nom_Hotel });
            if (!hotel) {
                return res.status(404).send('Hotel not found.');
            }
            updateObject.Nom_Hotel = hotel._id;
        }
        if (Nom) updateObject.Nom = Nom;
        if (Prénom) updateObject.Prénom = Prénom;
        if (Numéro_Téléphone) updateObject.Numéro_Téléphone = Numéro_Téléphone;
        if (Date_entre) updateObject.Date_entre = Date_entre;
        if (Date_sortie) updateObject.Date_sortie = Date_sortie;
        if (Nombre_Personne) updateObject.Nombre_Personne = Nombre_Personne;
        if (Nombre_Chambre) updateObject.Nombre_Chambre = Nombre_Chambre;

        await HotelReservSchema.findByIdAndUpdate(req.params.id, updateObject);
        res.redirect("/Cards-reservation");
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
//Delete client hotel reserver
const client_delete_HotelReservation = async (req, res) => {
    try {
        await HotelReservSchema.findByIdAndDelete(req.params.id);
        res.redirect("/Cards-reservation");
    } catch (error) {
        console.log('Error deleting reservation:', error);
        res.status(500).send('Internal Server Error');
    }
};

//get view index page car
const client_getIndex_car = async (req, res) => {
    const carinfo = await Cars.find({}); 


 try{  
        res.render("client/index-car", {
          title:'client Service',
          carinfo,
        });
    } catch (error) {
        console.log(error);
    }
}

//client Find Car
const client_add_Find_car = async (req, res) => {
    try {
      const { name_companies, Date_de_ramassage, Lieu_de_ramassage, Temps } = req.body;
  
      
      if (!name_companies || !Date_de_ramassage || !Lieu_de_ramassage || !Temps) {
        return res.status(400).send("All fields are required.");
      }
  
      
      const carfind = await Cars.find({ name_companies });
  
     
      if (carfind.length === 0) {
        return res.status(404).send('Car not found.');
      }
      const carfindLength = carfind.length;
  
      res.render("client/cardCars",{
        carfind,
        carfindLength,
        title:"client cards"
      })
    } catch (error) {
      console.error(error);
      res.status(500).send('An error occurred while finding the car.');
    }
};

//CRUD RESRVATION CAR*****************
//GET VIEW ADD CAR RESERVATION
const client_get_AddCarReservation = async (req, res) => {
    const cars = await Cars.find({}) 

    try {
       
        res.render('client/add_carReservation',{
            cars,
            title:"Service Client"
        })
    } catch (error) {
        console.log(error);
    }
}

//store reservation  Hotel db
const client_AddCarReservation = async (req, res) => {
    try {
        const { name_companies, date_sortie_car, date_retourne,Email, genre, tele,Prenom,Nom,username} = req.body;

        if (!name_companies) {
            return res.status(400).send('Nom-Car is required.');
        }

        const car= await Cars.findOne({ name_companies });
       

        if (!car) {
            return res.status(404).send('car not found.');
        }

        const reservationCar = new Car_reservation({
            name_companies: car._id,
            date_sortie_car,
            date_retourne,
            Email,
            genre,
            tele,
            Prenom,
            Nom,
            username,
          
        });

        await reservationCar.save();
        

        res.redirect("/Cards-reservationCar")
    } catch (error) {
        console.log('Error creating reservation:', error);
        res.status(500).send('Internal Server Error');
    }
};

//get All reservation Client

const client_getAll_CardReservationCar = async (req, res) => {
    try {
        let totalallcarsReservation = 0;
        const cardReservationCars = await Car_reservation.find({ username: req.session.username }).populate("name_companies");
        const reservationsCarWithPrice = cardReservationCars.map(reservationcar => {
            const dateSortieVoiture = new Date(reservationcar.date_sortie_car);
            const dateRetourneVoiture = new Date(reservationcar.date_retourne);
            const days = Math.ceil((dateRetourneVoiture - dateSortieVoiture) / (1000 * 60 * 60 * 24)); // Convert date difference to days
            const totalPriceCar = days * reservationcar.name_companies.prix; // Calculate total price using name_companies.prix
            totalallcarsReservation = totalallcarsReservation + totalPriceCar
            return {
                ...reservationcar.toObject(),
                totalPriceCar
            };
        });
        const ReservationLenghtCar= reservationsCarWithPrice.length
        res.render("client/card-ReservationCar", { 
            cardReservationCars,
            reservationsCarWithPrice,
            totalallcarsReservation,
            ReservationLenghtCar,
            title: 'Card Reservation Car'
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
};

 //GET VIEW EDIT RESERVATION 
 const client_edit_carReservation_id = async (req, res) => {
    try {
        const Car_ReservInfo = await Car_reservation.findById(req.params.id).populate('name_companies');
        if (!Car_ReservInfo) {
            return res.status(404).send('Reservation not found.');
        }
        res.render("client/edit_carReservation", { Car_ReservInfo, title:"Service client" });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
//put in db hotel reservation
const client_edit_CarReservation = async (req, res) => {
    try {
        const { name_companies, date_sortie_car, date_retourne,Email, genre, tele,Prenom,Nom} = req.body;
        const updateObject = {};

        if (name_companies) {
            const car = await Cars.findOne({ name_companies });
            if (!car) {
                return res.status(404).send('Hotel not found.');
            }
            updateObject.name_companies = car._id;
        }
        if (date_sortie_car) updateObject.date_sortie_car = date_sortie_car;
        if (date_retourne) updateObject.date_retourne = date_retourne;
        if (Email) updateObject.Email = Email;
        if (genre) updateObject.genre = genre;
        if (tele) updateObject.tele = tele;
        if (Prenom) updateObject.Prenom = Prenom;
        if (Nom) updateObject.Nom = Nom;
       

        await Car_reservation.findByIdAndUpdate(req.params.id, updateObject);
        res.redirect("/Cards-reservationCar");
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

//Delete client hotel reserver
const client_delete_CarReservation = async (req, res) => {
    try {
        await Car_reservation.findByIdAndDelete(req.params.id);
        res.redirect("/Cards-reservationCar");
    } catch (error) {
        console.log('Error deleting reservation:', error);
        res.status(500).send('Internal Server Error');
    }
};
//contact 
const Contact =  (req,res)=>{
    try{
     res.render("client/Contact",{
        title : "service client"
     });
    }catch(err){
     console.log(err)
    }
 }
 //post contact
 const client_add_contact = async (req,res)=>{
    try{
     
     const {nomComplet,adresseEmail,message} = req.body
     const addContact = new ContactShema ({
        nomComplet,
        adresseEmail,
        message,
        
      
    });

    await addContact.save();
    res.redirect("/contact")
    }catch(err){
     console.log(err)
    }
 }
//contact 
const Teamworeked = (req,res)=>{
    try{
     res.render("client/TeamWorked",{
        title : "service client"
     });
    }catch(err){
     console.log(err)
    }
 }

 //integer stripe checkout car
 const checkoutCar= async (req, res) => {
    try {
        // Calculate the total amount
        let totalAmount = 0;
        const cardReservationCars = await Car_reservation.find({ username: req.session.username }).populate("name_companies");

        cardReservationCars.forEach(reservationcar => {
            const dateSortieVoiture = new Date(reservationcar.date_sortie_car);
            const dateRetourneVoiture = new Date(reservationcar.date_retourne);
            const days = Math.ceil((dateRetourneVoiture - dateSortieVoiture) / (1000 * 60 * 60 * 24)); // Convert date difference to days
            const totalPriceCar = days * (reservationcar.name_companies.prix ); // Calculate total price
            totalAmount += totalPriceCar;
        });

        // Create a Stripe Checkout session
        const session = await Stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Car Reservation Payment', 
                        },
                        unit_amount: totalAmount * 100, // Convert dollars to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:2002/completeCar',
            cancel_url: 'http://localhost:2002/cancelCar',
        });
       

        // Redirect to Stripe Checkout
        res.redirect(session.url);
    } catch (error) {
        console.error('Error creating Stripe Checkout session:', error);
        res.status(500).send('Internal Server Error');
    }
};
const completeCar = async (req, res) => {
    res.send( 'Payment Successful', 'Thank you for your payment!' );
}
const cancelCar = async (req, res) => {
    res.redirect('/Cards-reservationCar' );
};
//integer stripe checkout hotel
//************** */
const checkoutHotel = async (req, res) => {
    try {
        // Fetch user's hotel reservations
        const CardReservation = await HotelReservSchema.find({ username: req.session.username }).populate("Nom_Hotel");

        // Calculate the total amount for the reservations
        let totalAmount = 0;
        CardReservation.forEach(reservation => {
            const dateEntre = new Date(reservation.Date_entre);
            const dateSortie = new Date(reservation.Date_sortie);
            const days = Math.ceil((dateSortie - dateEntre) / (1000 * 60 * 60 * 24)); // Calculate the number of days
            const totalPrice = days * reservation.Nom_Hotel.Prix; // Calculate the total price for this reservation
            totalAmount += totalPrice; // Sum up the total amount
        });

        // Ensure the total amount is in USD cents
        const totalAmountInCents = Math.round(totalAmount * 100);

        // Create a Stripe Checkout session
        const session = await Stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Specify payment method types
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Hotel Reservation Payment',
                        },
                        unit_amount: totalAmountInCents, // Total amount in cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:2002/completeHotel',
            cancel_url: 'http://localhost:2002/cancelHotel',
        });

        // Redirect to Stripe Checkout
        res.redirect(session.url);
    } catch (error) {
        console.error('Error creating Stripe Checkout session:', error);
        res.status(500).send('Internal Server Error');
    }
};

const completeHotel = async (req, res) => {
    res.send( 'Payment Successful', 'Thank you for your payment!' );
}
const cancelHotel = async (req, res) => {
    res.redirect('/Cards-reservation' );
};
//************** */
//settings client 
const client_settings = async (req, res) => {
    try {
        const client=  req.session.username;

        const clientx = await ClientSchema.findOne({ username: client });
        
        if (!clientx) {
            return res.status(404).send('User not found');
        }

      
        res.render('client/Settings', { 
            title: 'Settings',
            clientx
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

//clinet_myBooking  
const clinet_myBooking = async (req, res) => {
    const hoteldBookingClient = await HotelReservSchema.find({ username: req.session.username }).populate("Nom_Hotel");
    const CarBookingClient = await Car_reservation.find({ username: req.session.username }).populate("name_companies");
    const flightBookingClient = await flightReservationshema.find({ username: req.session.username }).populate("name_compagnies");
console.log(flightBookingClient);
    try {
    
    
        res.render("client/MyBooking", { 
            CarBookingClient,
            hoteldBookingClient,
            flightBookingClient,
            title: 'card Reservation'
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

//get view delete profile
//view get alert deleteù
const popaup_delete =  async (req,res)=>{


    try{
        res.render('client/deleteProfile')
        

    }catch(err){
     console.log(err)
    }
 }
//click btn and delete
const deleteProfile =  async (req,res)=>{
    const client=  req.session.username;


    try{
        await ClientSchema.deleteOne({ username: client });
      res.redirect("/login")
    }catch(err){
     console.log(err)
    }
 }
 //get all hoteles to client
 const client_getAll_Hoteles = async (req,res)=>{
    const hoteles = await HotelSchema.find({})
    try{
     res.render("client/All_Hotels",{
        hoteles,
     });
    }catch(err){
     console.log(err)
    }
 }
 //get hotel by id with details
 const client_getAll_Hoteles_id = async (req, res) => {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid hotel ID");
    }

    try {
        const hotel = await HotelSchema.findById(id);
        if (!hotel) {
            return res.status(404).send("Hotel not found");
        }
        res.render("client/Hotel_detail", {
            hotel,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};
 //get all cars to client
 const client_getAll_cars = async (req,res)=>{
    const car = await Cars.find({})
    try{
     res.render("client/all_cars",{
        car,
     });
    }catch(err){
     console.log(err)
    }
 }
  //get car by id with details
  const client_getAll_car_id = async (req, res) => {
    const { id } = req.params;

    // Validate the ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).send("Invalid hotel ID");
    }

    try {
        const car = await Cars.findById(id);
        if (!car) {
            return res.status(404).send("car not found");
        }
        res.render("client/Car_detail", {
            car,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
};

//logout responsable 

const client_logout = (req, res) => {
    res.clearCookie("clientToken");
    res.redirect("/login");
};

const error404 = (req,res)=>{
    try{
     res.render("page404",{
        title : "404 Page"
     });
    }catch(err){
     console.log(err)
    }
 }



module.exports = {
    Signup_Client,
    Signup,
    login_client,
    login,
    login_OAuth,
    client_logout,
    //Review
    getAddReview,
    postAddReview,
    deleteReview,

    findTicket,
    getTicketList,
    ListAllTicket,
    getFlight_detail,
    client_AddflightReservation,
    client_getAll_CardReservationFlight,
    client_getbyId_CardReservationFlight,
    client_EditflightReservation,
    client_EditflightReservation_byid,
    client_delete_flightReservation,
    //About and Contact and team
    About,
    Contact,
    Teamworeked,
    //post ciontact 
    client_add_contact,
    //client find hotel
    getIndexHotel,
    client_addhotelFind,
    //CRUD Reservation Client Hotel
    client_get_AddHotelReservation,
    client_AddHotelReservation,
    client_getAll_CardReservation,
    client_edit_HotelReservation_id,
    client_edit_HotelReservation,
    client_delete_HotelReservation,
    //get index car
    client_getIndex_car,
    //find car
    client_add_Find_car,
   //CRUD CAR RESERVATION
   client_get_AddCarReservation,
   client_AddCarReservation,
   client_getAll_CardReservationCar,
   client_edit_carReservation_id,
   client_edit_CarReservation,
   client_delete_CarReservation,
//strip Car
   checkoutCar,
   completeCar,
   cancelCar,
   //strip Hotel
   checkoutHotel,
   completeHotel,
   cancelHotel,
   // strip flight 
   checkoutFlight ,
   completeFlight ,
   cancelFlight ,

   //settings 
   client_settings,
   clinet_myBooking,
   popaup_delete,
   deleteProfile,

   //get all Hotel and car to client and details
   client_getAll_Hoteles,
   client_getAll_Hoteles_id,
   client_getAll_cars,
   client_getAll_car_id,

   error404,
   

}