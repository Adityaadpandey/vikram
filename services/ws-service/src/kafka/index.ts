import { Kafka, Partitioners } from "kafkajs";
import { config } from "../config";

const kafka = new Kafka({
  clientId: "ws-service",
  brokers: [config.KAFKA_BROKER],
});

export const producer = kafka.producer({
  allowAutoTopicCreation: true,
  createPartitioner: Partitioners.DefaultPartitioner,
});

export const connectKafka = async () => {
  try {
    await producer.connect();
    console.info("Kafka producer connected");
  } catch (error) {
    console.error("Error connecting to Kafka producer", error);
    throw error;
  }
};

process.on("SIGTERM", async () => {
  await producer.disconnect();
  console.info("Kafka producer disconnected");
});

process.on("SIGINT", async () => {
  await producer.disconnect();
  console.info("Kafka producer disconnected");
});
