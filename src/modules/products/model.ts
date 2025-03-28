import mongoose, {Document, Schema} from 'mongoose';

interface IProduct {
    idForeign: string;
    title: string;
    price: number;
    description: string;
    category: string;
    image: string;
}

const productSchema = new Schema({
    idForeign: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    }
}, {
    timestamps: true,
})

export const productModel = mongoose.model<IProduct>('Product', productSchema);