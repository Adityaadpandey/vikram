import { Link } from "expo-router";
import React, { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, Text, View } from "react-native";
import { Container } from "@/components/container";
import { useAuth } from "@/contexts/auth-context";

const BASE_URL = "https://set-daring-tadpole.ngrok-free.app/api/v1";

const SubjectsMap = () => {
  const { token } = useAuth();
  const [subjects, setSubjects] = useState([]);

  const fetchData = async () => {
    try {
      const res = await fetch(`${BASE_URL}/student`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.success) {
        setSubjects(json.data.student_subjects);
      } else {
        console.warn("Failed to fetch subjects");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <SafeAreaView>
      <ScrollView className="p-4">
        {subjects.map((item, index) => {
          const subject = item.subject;
          return (
            <View
              key={subject.subject_id}
              className="mb-4 p-4 bg-white rounded shadow"
            >
              <Link href={`../subject/${subject.subject_id}`}>
                <Text className="text-lg font-bold">{subject.name}</Text>
                <Text className="text-gray-700">
                  Group: {subject.group.name}
                </Text>
                <Text className="text-gray-700">
                  Class Code: {subject.group.class.class_code}
                </Text>
              </Link>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
};

const Three = () => {
  return (
    <Container>
      <ScrollView className="flex-1 p-6 bg-gray-50">
        <SubjectsMap />
      </ScrollView>
    </Container>
  );
};

export default Three;
