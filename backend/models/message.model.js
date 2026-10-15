import mongoose from "mongoose";

const messageSchema=new mongoose.Schema({
sender:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User"
},
receiver:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User" 
},
message:{
   type:String 
},
image:{
    type:String  
},
  unlockDate: {
    type: Date, // 🎁 message kab unlock hoga
    default: Date.now
  }
},{timestamps:true})

const Message=mongoose.model("Message",messageSchema)
export default Message