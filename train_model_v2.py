import os
import tensorflow as tf
import numpy as np
import matplotlib.pyplot as plt

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Dense,
    Dropout,
    Flatten,
    BatchNormalization
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping,
    ReduceLROnPlateau,
    ModelCheckpoint
)
from sklearn.utils.class_weight import compute_class_weight

# ----------------------------
# Configuration
# ----------------------------

IMAGE_SIZE = (48, 48)
BATCH_SIZE = 128  # Increased batch size for faster GPU training and smoother gradients
EPOCHS = 40
NUM_CLASSES = 7

TRAIN_DIR = "dataset/train"
TEST_DIR = "dataset/test"

# ----------------------------
# Data Augmentation (Gentler to preserve facial features)
# ----------------------------

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=10,          # Reduced from 20 to prevent head-tilt distortion
    width_shift_range=0.1,      # Reduced from 0.2 to prevent cropping out key facial features
    height_shift_range=0.1,     # Reduced from 0.2
    zoom_range=0.1,             # Reduced from 0.2
    shear_range=0.1,            # Reduced from 0.15
    horizontal_flip=True,
    fill_mode="nearest"
)

test_datagen = ImageDataGenerator(
    rescale=1.0/255
)

# ----------------------------
# Load Dataset
# ----------------------------

train_generator = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMAGE_SIZE,
    color_mode="grayscale",
    class_mode="categorical",
    batch_size=BATCH_SIZE,
    shuffle=True
)

validation_generator = test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMAGE_SIZE,
    color_mode="grayscale",
    class_mode="categorical",
    batch_size=BATCH_SIZE,
    shuffle=False
)

print("\nClasses Found:")
print(train_generator.class_indices)

print("\nTraining Samples:", train_generator.samples)
print("Validation Samples:", validation_generator.samples)

# ----------------------------
# Build Deeper & Wider CNN Model
# ----------------------------

model = Sequential()

# Block 1
model.add(Conv2D(64, (3,3), padding="same", activation="relu", input_shape=(48,48,1)))
model.add(BatchNormalization())
model.add(Conv2D(64, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.25))

# Block 2
model.add(Conv2D(128, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(Conv2D(128, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.30))

# Block 3
model.add(Conv2D(256, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(Conv2D(256, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.40))

# Block 4 (New deeper block to capture high-level semantic representation)
model.add(Conv2D(512, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(Conv2D(512, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.40))

# Dense Layers
model.add(Flatten())

model.add(Dense(1024, activation="relu"))
model.add(BatchNormalization())
model.add(Dropout(0.50))

model.add(Dense(512, activation="relu"))
model.add(BatchNormalization())
model.add(Dropout(0.50))

model.add(Dense(NUM_CLASSES, activation="softmax"))

# ----------------------------
# Model Summary
# ----------------------------

model.summary()

# ----------------------------
# Compile Model
# ----------------------------

# Using a slightly lower learning rate (0.0005) for smoother and better convergence
model.compile(
    optimizer=tf.keras.optimizers.legacy.Adam(learning_rate=0.0005),
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

# ----------------------------
# Callbacks
# ----------------------------

checkpoint = ModelCheckpoint(
    "emotion_model.keras",
    monitor="val_accuracy",
    save_best_only=True,
    verbose=1
)

early_stop = EarlyStopping(
    monitor="val_loss",
    patience=8,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=3,
    verbose=1,
    min_lr=1e-6
)

callbacks = [
    checkpoint,
    early_stop,
    reduce_lr
]

# ----------------------------
# Train Model
# ----------------------------

print("\nStarting Training with Improved Configuration...\n")

# Compute class weights to address imbalance
classes = list(range(NUM_CLASSES))
class_weights = compute_class_weight(
    class_weight='balanced',
    classes=np.array(classes),
    y=train_generator.classes
)
class_weight_dict = {i: float(w) for i, w in enumerate(class_weights)}
print('Using class weights:', class_weight_dict)

history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    class_weight=class_weight_dict
)

# ----------------------------
# Save Final Model
# ----------------------------

# The checkpoint callback already saves the best validation accuracy model, but let's save the final model too
model.save("emotion_model_final.keras")

print("\nTraining Completed Successfully!")

# ----------------------------
# Evaluate Best Model
# ----------------------------

print("Evaluating best model...")
best_model = tf.keras.models.load_model("emotion_model.keras")
loss, accuracy = best_model.evaluate(validation_generator)

print(f"\nBest Validation Loss : {loss:.4f}")
print(f"Best Validation Accuracy : {accuracy*100:.2f}%")

# ----------------------------
# Plot Accuracy & Loss
# ----------------------------

plt.figure(figsize=(12,5))

plt.subplot(1,2,1)
plt.plot(history.history["accuracy"], label="Training Accuracy")
plt.plot(history.history["val_accuracy"], label="Validation Accuracy")
plt.title("Accuracy")
plt.xlabel("Epoch")
plt.ylabel("Accuracy")
plt.legend()

plt.subplot(1,2,2)
plt.plot(history.history["loss"], label="Training Loss")
plt.plot(history.history["val_loss"], label="Validation Loss")
plt.title("Loss")
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.legend()

plt.tight_layout()
plt.savefig("training_results_v2.png")
print("\nTraining graph saved as training_results_v2.png")
