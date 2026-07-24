import os
import tensorflow as tf
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

# ----------------------------
# Configuration
# ----------------------------

IMAGE_SIZE = (48, 48)
BATCH_SIZE = 64
EPOCHS = 100
NUM_CLASSES = 7

TRAIN_DIR = "dataset/train"
TEST_DIR = "dataset/test"

# ----------------------------
# Data Augmentation
# ----------------------------

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    zoom_range=0.2,
    shear_range=0.15,
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

print("\nTraining Images:", train_generator.samples)
print("Validation Images:", validation_generator.samples)

# ----------------------------
# Build CNN Model
# ----------------------------

# ----------------------------
# Build Improved CNN Model
# ----------------------------

model = Sequential()

# Block 1
model.add(Conv2D(32, (3,3), padding="same", activation="relu",
                 input_shape=(48,48,1)))
model.add(BatchNormalization())

model.add(Conv2D(32, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())

model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.25))

# Block 2
model.add(Conv2D(64, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())

model.add(Conv2D(64, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())

model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.30))

# Block 3
model.add(Conv2D(128, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())

model.add(Conv2D(128, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())

model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.40))

# Dense Layers
model.add(Flatten())

model.add(Dense(512, activation="relu"))
model.add(BatchNormalization())
model.add(Dropout(0.50))

model.add(Dense(256, activation="relu"))
model.add(Dropout(0.40))

model.add(Dense(7, activation="softmax"))



# ----------------------------
# Model Summary
# ----------------------------

model.summary()

# ----------------------------
# Compile Model
# ----------------------------

model.compile(
    optimizer="adam",
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
    patience=10,
    restore_best_weights=True,
    verbose=1
)

reduce_lr = ReduceLROnPlateau(
    monitor="val_loss",
    factor=0.2,
    patience=4,
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

print("\nStarting Training...\n")

history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=EPOCHS,
    callbacks=callbacks
)

# ----------------------------
# Save Final Model
# ----------------------------

model.save("emotion_model.keras")

print("\nTraining Completed Successfully!")
print("Model saved as emotion_model.keras")

# ----------------------------
# Evaluate Model
# ----------------------------

loss, accuracy = model.evaluate(validation_generator)

print(f"\nValidation Loss : {loss:.4f}")
print(f"Validation Accuracy : {accuracy*100:.2f}%")

# ----------------------------
# Plot Accuracy
# ----------------------------

plt.figure(figsize=(12,5))

plt.subplot(1,2,1)

plt.plot(
    history.history["accuracy"],
    label="Training Accuracy"
)

plt.plot(
    history.history["val_accuracy"],
    label="Validation Accuracy"
)

plt.title("Accuracy")

plt.xlabel("Epoch")

plt.ylabel("Accuracy")

plt.legend()

# ----------------------------
# Plot Loss
# ----------------------------

plt.subplot(1,2,2)

plt.plot(
    history.history["loss"],
    label="Training Loss"
)

plt.plot(
    history.history["val_loss"],
    label="Validation Loss"
)

plt.title("Loss")

plt.xlabel("Epoch")

plt.ylabel("Loss")

plt.legend()

plt.tight_layout()

plt.savefig("training_results.png")

plt.show()

print("\nTraining graph saved as training_results.png")