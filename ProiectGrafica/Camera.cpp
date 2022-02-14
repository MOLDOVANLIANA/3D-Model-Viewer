#include "Camera.hpp"

namespace gps {

    //Camera constructor
    Camera::Camera(glm::vec3 cameraPosition, glm::vec3 cameraTarget, glm::vec3 cameraUp)
        : cameraPosition(cameraPosition)
    {
        this->cameraTarget = cameraTarget;
        this->cameraUpDirection = cameraUp;


		cameraFrontDirection = glm::normalize(cameraTarget - cameraPosition);
        cameraRightDirection = glm::normalize(glm::cross(cameraFrontDirection, cameraUpDirection));
    }

    //return the view matrix, using the glm::lookAt() function
    glm::mat4 Camera::getViewMatrix() {
        return glm::lookAt(cameraPosition, cameraFrontDirection + cameraPosition, cameraUpDirection);
    }

    //update the camera internal parameters following a camera move event
    void Camera::move(MOVE_DIRECTION direction, float speed) {

        const glm::vec3 up = glm::vec3(0.0f, 1.0f, 0.0f);

        switch (direction)
        {
        case MOVE_FORWARD:
			cameraPosition += cameraFrontDirection * speed;
            break;
        case MOVE_BACKWARD:
			cameraPosition -= cameraFrontDirection * speed;
            break;
        case MOVE_RIGHT:
			cameraPosition += cameraRightDirection * speed;
            break;
        case MOVE_LEFT:
			cameraPosition -= cameraRightDirection * speed;
            break;
        default:
            break;
        }
    }

    //update the camera internal parameters following a camera rotate event
    //yaw - camera rotation around the y axis
    //pitch - camera rotation around the x axis
    void Camera::rotate(float pitchOffset, float yawOffset)
    {
        const float sensitivity = 0.1f;
		const glm::vec3 up = glm::vec3(0.0f, 1.0f, 0.0f);

        Yaw += yawOffset * sensitivity;
		Yaw = glm::mod(Yaw, 360.f);

        Pitch += pitchOffset * sensitivity;

        printf("Yaw Value: %f  Pitch Value %f \n", Yaw, Pitch);

        Pitch = glm::clamp(Pitch, -89.f, 89.f);

        glm::vec3 cameraFront;
        cameraFront.x = glm::cos(glm::radians(Yaw)) * glm::cos(glm::radians(Pitch));
        cameraFront.y = glm::sin(glm::radians(Pitch));
        cameraFront.z = glm::sin(glm::radians(Yaw)) * glm::cos(glm::radians(Pitch));

        cameraFrontDirection = glm::normalize(cameraFront);
        cameraRightDirection = glm::normalize(glm::cross(cameraFrontDirection, up));
        cameraUpDirection = glm::normalize(glm::cross(cameraRightDirection, cameraFrontDirection));
    }
}