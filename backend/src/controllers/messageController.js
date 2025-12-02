import Message from "../models/Message.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import { getSocketId, io } from "../lib/socket.js";
import cloudinary from '../lib/cloudinary.js';

// import 
export const getUsers = async (req, res) => {
    try {
        const { id } = req.params;

        // Search in both collections
        const [patient, doctor] = await Promise.all([
            Patient.findById(id).select("-password"),
            Doctor.findById(id).select("-password")
        ]);

        if (!patient && !doctor) {
            return res.status(404).json({
                success: false,
                message: "User not found in either collection"
            });
        }

        // Determine which user was found and their role
        const foundUser = patient || doctor;
        const userRole = patient ? 'patient' : 'doctor';

        res.status(200).json({
            success: true,
            data: {
                ...foundUser.toObject(),
                role: userRole
            }
        });
    } catch (error) {
        console.error("Error in getting user:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const fetchMessages =async(req,res)=>{
    try {
        const {receiverId} = req.params;

        const senderId= req.user._id;
//        here we shoudl use await to prevent error s
// refer https://www.geeksforgeeks.org/mongodb-db-collection-find-method/
        const messages= await Message.find({$or:[
            {senderId:senderId,receiverId:receiverId},
            {receiverId:senderId,senderId:receiverId}
        ]})
        

        res.status(200).json({success:true,messages});
        
    } catch (error) {
        console.log("error in fethcing messages",error);
        res.status(500).json({success:false,message:error})
    }
}


export const sendMessage = async(req, res) => {
    try {
        const senderId = req.user._id;
        const { receiverId } = req.params;
        const { text, image } = req.body;
        
        // ✅ Debug logging
        console.log("📤 Send Message Request:");
        console.log("Sender ID:", senderId);
        console.log("Receiver ID:", receiverId);
        console.log("Text:", text);
        console.log("Image:", image ? "Image data present" : "No image");
        console.log("Full body:", req.body);
        
        // ✅ Validate that either text or image exists
        if (!text && !image) {
            console.log("❌ Empty message - no text or image");
            return res.status(400).json({
                success: false,
                message: "Message must contain either text or image"
            });
        }
        
        let imageUrl = null;
        
        if (image) {
            try {
                console.log("🖼️ Uploading image to Cloudinary...");
                const uploadData = await cloudinary.uploader.upload(image);
                imageUrl = uploadData.secure_url;
                console.log("✅ Image uploaded:", imageUrl);
            } catch (uploadError) {
                console.error("❌ Cloudinary upload error:", uploadError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload image"
                });
            }
        }

        const newMessage = new Message({
            senderId: senderId,
            receiverId: receiverId,
            text: text || "",
            image: imageUrl,
        });
        
        console.log("💾 Saving message:", {
            senderId: newMessage.senderId,
            receiverId: newMessage.receiverId,
            text: newMessage.text,
            hasImage: !!newMessage.image
        });
        
        await newMessage.save();
        console.log("✅ Message saved with ID:", newMessage._id);
        
        const receiverSocketId = getSocketId(receiverId);
        console.log("🔍 Receiver socket ID:", receiverSocketId);
        
        if (receiverSocketId) {
            console.log("📡 Emitting to receiver socket");
            io.to(receiverSocketId).emit("newMessage", newMessage);
        } else {
            console.log("⚠️ Receiver not online");
        }

        res.status(201).json({ success: true, newMessage });
    } catch (error) {
        console.error("❌ Failed to save message:", error);
        res.status(500).json({ success: false, message: error.message });
    }
}