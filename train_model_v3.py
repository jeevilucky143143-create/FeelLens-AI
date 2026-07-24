"""
Face Emotion Detection — Improved Training Script v3
=====================================================
Fixes:
  - Class weights to handle Disgust (436) vs Happy (7215) imbalance
  - Legacy Adam optimizer for Mac M-series GPU
  - Deeper CNN (4 blocks: 64→128→256→512)
  - Gentle augmentation (preserve facial features on 48×48)
  - Confusion matrix + per-class accuracy
  - FER-2013 correct label ordering
"""

import os
import numpy as np
import tensorflow as tf
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import (
    Conv2D, MaxPooling2D, Dense, Dropout, Flatten, BatchNormalization
)
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

# ----------------------------
# Configuration
# ----------------------------

IMAGE_SIZE = (48, 48)
BATCH_SIZE = 64
EPOCHS = 60
NUM_CLASSES = 7

TRAIN_DIR = "dataset/train"
TEST_DIR = "dataset/test"

# FER-2013 standard label ordering
EMOTION_LABELS = ["Angry", "Disgust", "Fear", "Happy", "Sad", "Surprise", "Neutral"]

# ----------------------------
# Data Augmentation (gentle — preserve facial features on 48×48)
# ----------------------------

train_datagen = ImageDataGenerator(
    rescale=1./255,
    rotation_range=10,
    width_shift_range=0.1,
    height_shift_range=0.1,
    zoom_range=0.1,
    shear_range=0.1,
    horizontal_flip=True,
    fill_mode="nearest"
)

test_datagen = ImageDataGenerator(rescale=1.0/255)

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

print("\nKeras class_indices:", train_generator.class_indices)
print("FER-2013 labels:   ", EMOTION_LABELS)
print("\nTraining Images:", train_generator.samples)
print("Validation Images:", validation_generator.samples)

# ----------------------------
# Compute Class Weights (handle imbalance)
# ----------------------------

class_weights_array = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(train_generator.classes),
    y=train_generator.classes
)
class_weights = dict(enumerate(class_weights_array))

print("\nClass weights (balanced):")
for idx, weight in class_weights.items():
    label = EMOTION_LABELS[idx]
    count = np.sum(train_generator.classes == idx)
    print(f"  {label:>10} (idx {idx}): weight={weight:.3f}, count={count}")

# ----------------------------
# Build Deeper CNN Model (4 blocks)
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
model.add(Dropout(0.35))

# Block 4
model.add(Conv2D(512, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(Conv2D(512, (3,3), padding="same", activation="relu"))
model.add(BatchNormalization())
model.add(MaxPooling2D((2,2)))
model.add(Dropout(0.40))

# Dense Layers
model.add(Flatten())

model.add(Dense(512, activation="relu"))
model.add(BatchNormalization())
model.add(Dropout(0.50))

model.add(Dense(256, activation="relu"))
model.add(BatchNormalization())
model.add(Dropout(0.40))

model.add(Dense(NUM_CLASSES, activation="softmax"))

model.summary()

# ----------------------------
# Compile Model (legacy Adam for Mac GPU)
# ----------------------------

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

callbacks = [checkpoint, early_stop, reduce_lr]

# ----------------------------
# Train Model
# ----------------------------

print("\n" + "="*60)
print("Starting Training with Class Weights...")
print("="*60 + "\n")

history = model.fit(
    train_generator,
    validation_data=validation_generator,
    epochs=EPOCHS,
    callbacks=callbacks,
    class_weight=class_weights
)

# ----------------------------
# Evaluate Best Model
# ----------------------------

print("\n" + "="*60)
print("Evaluating Best Model...")
print("="*60)

best_model = tf.keras.models.load_model("emotion_model.keras")
loss, accuracy = best_model.evaluate(validation_generator)
print(f"\nBest Validation Loss:     {loss:.4f}")
print(f"Best Validation Accuracy: {accuracy*100:.2f}%")

# ----------------------------
# Confusion Matrix + Per-Class Accuracy
# ----------------------------

print("\n" + "="*60)
print("Per-Class Classification Report")
print("="*60)

predictions = best_model.predict(validation_generator)
pred_classes = np.argmax(predictions, axis=1)
true_classes = validation_generator.classes

print(classification_report(true_classes, pred_classes, target_names=EMOTION_LABELS))

cm = confusion_matrix(true_classes, pred_classes)
print("Confusion Matrix:")
header = "           " + "  ".join(f"{l[:3]:>5}" for l in EMOTION_LABELS)
print(header)
for i, row in enumerate(cm):
    row_str = "  ".join(f"{v:5d}" for v in row)
    print(f"{EMOTION_LABELS[i]:>10}: {row_str}")

# ----------------------------
# Plot Training Curves
# ----------------------------

fig, axes = plt.subplots(1, 3, figsize=(18, 5))

# Accuracy
axes[0].plot(history.history["accuracy"], label="Train")
axes[0].plot(history.history["val_accuracy"], label="Validation")
axes[0].set_title("Accuracy")
axes[0].set_xlabel("Epoch")
axes[0].set_ylabel("Accuracy")
axes[0].legend()
axes[0].grid(True, alpha=0.3)

# Loss
axes[1].plot(history.history["loss"], label="Train")
axes[1].plot(history.history["val_loss"], label="Validation")
axes[1].set_title("Loss")
axes[1].set_xlabel("Epoch")
axes[1].set_ylabel("Loss")
axes[1].legend()
axes[1].grid(True, alpha=0.3)

# Confusion Matrix Heatmap
im = axes[2].imshow(cm, interpolation="nearest", cmap=plt.cm.Blues)
axes[2].set_title("Confusion Matrix")
tick_marks = np.arange(len(EMOTION_LABELS))
axes[2].set_xticks(tick_marks)
axes[2].set_xticklabels([l[:3] for l in EMOTION_LABELS], rotation=45)
axes[2].set_yticks(tick_marks)
axes[2].set_yticklabels(EMOTION_LABELS)
axes[2].set_ylabel("True")
axes[2].set_xlabel("Predicted")

# Add text annotations to confusion matrix
thresh = cm.max() / 2.
for i in range(cm.shape[0]):
    for j in range(cm.shape[1]):
        axes[2].text(j, i, format(cm[i, j], "d"),
                     ha="center", va="center",
                     color="white" if cm[i, j] > thresh else "black",
                     fontsize=7)

plt.tight_layout()
plt.savefig("training_results_v3.png", dpi=150)
print("\nTraining graphs saved as training_results_v3.png")

print("\n" + "="*60)
print("TRAINING COMPLETE!")
print("="*60)
