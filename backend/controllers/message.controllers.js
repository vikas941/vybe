import uploadOnCloudinary from "../config/cloudinary.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import { getSocketId, io } from "../socket.js";

// export const sendMessage=async (req,res)=>{
//     try {
//         const senderId=req.userId
//         const receiverId=req.params.receiverId
//         const {message}=req.body

//         let image;
//         if(req.file){
//             image=await uploadOnCloudinary(req.file.path)
//         }

//         const newMessage=await Message.create({
//             sender:senderId,
//             receiver:receiverId,
//             message,
//             image
//         })

//         let conversation=await Conversation.findOne({
//             participants:{$all:[senderId,receiverId]}
//         })
//         if(!conversation){
//             conversation=await Conversation.create({
//                 participants:[senderId,receiverId],
//                 messages:[newMessage._id]
//             })
//         }else{
// conversation.messages.push(newMessage._id)
// await conversation.save()
//         }

// const receiverSocketId=getSocketId(receiverId)
// if(receiverSocketId){
// io.to(receiverSocketId).emit("newMessage",newMessage)
// }

// return res.status(200).json(newMessage)
//     } catch (error) {
//         return res.status(500).json({message:`send Message error ${error}`})
//     }
// }
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const receiverId = req.params.receiverId;
    const { message, unlockDate } = req.body;

    let image;
    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    // UnlockDate validation
    let unlock = unlockDate ? new Date(unlockDate) : new Date();
    if (unlock < new Date()) unlock = new Date(); // prevent past date

    // Create message
    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      message,
      image,
      unlockDate: unlock
    });

    // Conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        messages: [newMessage._id]
      });
    } else {
      conversation.messages.push(newMessage._id);
      await conversation.save();
    }

    // 🔹 SOCKET EMIT
    const receiverSocketId = getSocketId(receiverId);
    const senderSocketId = req.socketId;

    // Sender sees immediately
    if (senderSocketId) io.to(senderSocketId).emit("newMessage", newMessage);

    // Receiver sees immediately but locked flag
    if (receiverSocketId) io.to(receiverSocketId).emit("newMessage", newMessage);

    return res.status(200).json(newMessage);

  } catch (error) {
    return res.status(500).json({ message: `send Message error: ${error}` });
  }
};





// export const getAllMessages=async (req,res)=>{
//     try {
//          const senderId=req.userId
//         const receiverId=req.params.receiverId
//         const conversation=await Conversation.findOne({
//             participants:{$all:[senderId,receiverId]}
//         }).populate("messages")

//         return res.status(200).json(conversation?.messages)

//     } catch (error) {
//            return res.status(500).json({message:`get Message error ${error}`})
//     }
// }

export const getAllMessages = async (req, res) => {
  try {
    const senderId = req.userId;
    const receiverId = req.params.receiverId;

    // conversation find
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    const now = new Date();

    // 🎁 locked logic add
    const messagesWithLock = conversation.messages.map((msg) => {
      const locked = msg.unlockDate && new Date(msg.unlockDate) > now;
      if (locked) {
        // future date → sirf gift box info return
        return {
          _id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          locked: true,
          unlockDate: msg.unlockDate,
          createdAt: msg.createdAt
        };
      } else {
        // normal message
        return { ...msg.toObject(), locked: false };
      }
    });

    return res.status(200).json(messagesWithLock);

  } catch (error) {
    return res.status(500).json({ message: `get Message error ${error}` });
  }
};

export const getPrevUserChats=async (req,res)=>{
    try {
        const currentUserId=req.userId
        const conversations=await Conversation.find({
            participants:currentUserId
        }).populate("participants").sort({updatedAt:-1})

        const userMap={}    //562983u9:user
        conversations.forEach(conv => {
            conv.participants.forEach(user => {
               if(user._id!=currentUserId) {
                 userMap[user._id]=user
               }
            });
        });

        const previousUsers=Object.values(userMap)
        return res.status(200).json(previousUsers)

    } catch (error) {
          return res.status(500).json({message:`prev user error ${error}`})
    }
}