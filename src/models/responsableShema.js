const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const Schema = mongoose.Schema;

const responsableShema = new Schema({
    CIN: {
        type: String,
        required: true,
        unique: true,
    },
    name_Responsable: {
        type: String,
        required: true,
    },
    name_companies: {
        type: String,
        required: true,
    },
    birthday: {
        type: String,
        required: true,
    },
    num_tel: {
        type: String,
        required: true,
    },
    birthplace: {
        type: String,
        required :true,
    },
  
    email: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique :true,
    },
    password: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum: ['flight', 'car', 'hotel'],
    },

  

 
 
    createdAt: { type: Date, default: Date.now },
});
responsableShema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

module.exports = mongoose.model("ResponsableShema", responsableShema);