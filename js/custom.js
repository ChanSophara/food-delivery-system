$(function () {
  const ORDER_HISTORY_KEY = "orderHistory";

  // Initialize the cart from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log("Initial cart from localStorage:", cart); // Debugging: Log initial cart data

  // Validate the cart data on load
  cart = cart.filter((item) => {
    const price = parseFloat(item.price);
    const qty = parseInt(item.qty);
    if (isNaN(price) || isNaN(qty)) {
      console.error("Invalid item found in cart:", item);
      return false; // Remove invalid items
    }
    return true; // Keep valid items
  });

  // Save the cleaned cart back to localStorage
  localStorage.setItem("cart", JSON.stringify(cart));
  console.log("Cleaned cart saved to localStorage:", cart); // Debugging: Log cleaned cart data

  // Add to Cart JS
  $(document).on("submit", "form", function (event) {
    event.preventDefault();
    const $form = $(this); // The form that was submitted
    const foodName = $form.find("h4").text().trim(); // Food name
    const foodPriceText = $form.find(".food-price").text().replace("$", "").trim(); // Price text
    const foodPrice = parseFloat(foodPriceText); // Parse price as a number
    const foodQty = parseInt($form.find("input[type='number']").val()); // Parse quantity as a number
    const foodImg = $form.find("img").attr("src"); // Image URL

    // Debugging: Log extracted values
    console.log("Extracted values:", {
      foodName,
      foodPriceText,
      foodPrice,
      foodQty,
      foodImg,
    });

    // Ensure foodPrice and foodQty are valid numbers
    if (isNaN(foodPrice) || isNaN(foodQty)) {
      console.error("Invalid price or quantity for food item:", foodName);
      console.error("Price:", foodPrice, "Quantity:", foodQty);
      return; // Skip adding this item if the price or quantity is invalid
    }

    // Check if item already exists in cart
    const existingItem = cart.find((item) => item.name === foodName);
    if (existingItem) {
      existingItem.qty += foodQty; // Update quantity if item exists
    } else {
      cart.push({ name: foodName, price: foodPrice, qty: foodQty, img: foodImg }); // Add new item
    }

    // Save the updated cart to localStorage
    localStorage.setItem("cart", JSON.stringify(cart));
    console.log("Updated cart saved to localStorage:", cart); // Debugging: Log updated cart data

    renderCart(); // Update cart UI
    updateCartBadge();
  });

  // Render Cart Items
  function renderCart() {
    const $cartTable = $("#cart-content table");
    $cartTable.find("tr:not(:first)").remove(); // Clear existing rows (except header)

    let total = 0;
    cart.forEach((item) => {
      // Ensure item.price and item.qty are valid numbers
      const price = parseFloat(item.price);
      const qty = parseInt(item.qty);

      if (isNaN(price) || isNaN(qty)) {
        console.error(`Invalid price or quantity for item: ${item.name}`);
        return; // Skip this item if the price or quantity is invalid
      }

      const rowTotal = price * qty;
      total += rowTotal;

      const cartRow = `
        <tr>
          <td><img src="${item.img}" alt="${item.name}"></td>
          <td>${item.name}</td>
          <td>$${price.toFixed(2)}</td>
          <td>${qty}</td>
          <td>$${rowTotal.toFixed(2)}</td>
          <td><a href="#" class="btn-delete">&times;</a></td>
        </tr>
      `;
      $cartTable.append(cartRow);
    });

    // Update total price
    const totalElement = $("#cart-content th:nth-child(5)");
    if (totalElement.length) {
      totalElement.text("$" + total.toFixed(2));
    }
  }

  // Update Cart Badge JS
  function updateCartBadge() {
    const itemCount = cart.reduce((sum, item) => sum + item.qty, 0);
    $(".badge").text(itemCount);
  }

  // Initialize cart on page load
  renderCart();
  updateCartBadge();

  // ================== Order Page Specific Logic ==================
  if (window.location.pathname.includes("order.html")) {
    // Render cart items on the order page
    const $orderTable = $(".tbl-full");
    let total = 0;

    function renderOrderCart() {
      $orderTable.find("tr:not(:first)").remove(); // Clear existing rows
      total = 0;

      cart.forEach((item, index) => {
        // Ensure item.price and item.qty are valid numbers
        const price = parseFloat(item.price);
        const qty = parseInt(item.qty);

        if (isNaN(price) || isNaN(qty)) {
          console.error(`Invalid price or quantity for item: ${item.name}`);
          return; // Skip this item if the price or quantity is invalid
        }

        const rowTotal = price * qty;
        total += rowTotal;

        const orderRow = `
          <tr>
            <td>${index + 1}</td>
            <td><img src="${item.img}" alt="${item.name}"></td>
            <td>${item.name}</td>
            <td>$${price.toFixed(2)}</td>
            <td>${qty}</td>
            <td>$${rowTotal.toFixed(2)}</td>
            <td><a href="#" class="btn-delete">&times;</a></td>
          </tr>
        `;
        $orderTable.append(orderRow);
      });

      // Update total price
      $(".tbl-full th:nth-child(6)").text("$" + total.toFixed(2));
    }

    // Initial render
    renderOrderCart();

    // Handle delete button clicks in the Order page
    $(document).on("click", ".btn-delete", function (event) {
      event.preventDefault();
      const foodName = $(this).closest("tr").find("td:nth-child(3)").text();
      cart = cart.filter((item) => item.name !== foodName); // Remove item from cart
      localStorage.setItem("cart", JSON.stringify(cart)); // Update localStorage
      renderOrderCart(); // Re-render the cart
      updateCartBadge(); // Update the cart badge
    });

    // Handle form submission
    $("#order-form").on("submit", function (event) {
      event.preventDefault();

      // Save the current cart to order history
      let orderHistory = JSON.parse(localStorage.getItem(ORDER_HISTORY_KEY)) || [];
      orderHistory.push({
        date: new Date().toISOString(), // Add a timestamp
        items: cart, // Save the current cart items
        total: total // Save the total price
      });
      localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(orderHistory));

      // Show confirmation message
      $("#confirmation-message").fadeIn();

      // Clear the cart from localStorage
      localStorage.removeItem("cart");

      // Clear the cart UI
      cart = []; // Reset the cart array
      renderOrderCart(); // Re-render the cart
      updateCartBadge(); // Update the cart badge

      // Reset the form
      this.reset();

      // Hide the confirmation message after 5 seconds
      setTimeout(() => {
        $("#confirmation-message").fadeOut();
      }, 5000);
    });
  }

  // ================== Restore UX/UI Features ==================

  // Shopping Cart Toggle JS
  $("#shopping-cart").on("click", function (event) {
    event.stopPropagation(); // Prevent event bubbling
    $("#cart-content").toggle("blind", "", 500);
  });

  // Close cart when clicking outside
  $(document).on("click", function (event) {
    if (!$(event.target).closest("#shopping-cart, #cart-content").length) {
      $("#cart-content").hide();
    }
  });

  // Back-To-Top Button JS
  $("#back-to-top").click(function (event) {
    event.preventDefault();
    $("html, body").animate(
      {
        scrollTop: 0,
      },
      1000
    );
  });

  // Delete Cart Item JS
  $(document).on("click", ".btn-delete", function (event) {
    event.preventDefault();
    const foodName = $(this).closest("tr").find("td:nth-child(2)").text();
    cart = cart.filter((item) => item.name !== foodName); // Remove item from cart
    localStorage.setItem("cart", JSON.stringify(cart)); // Update localStorage
    $(this).closest("tr").remove(); // Remove from DOM
    updateCartBadge();
    renderCart(); // Re-render the cart
  });
  
  
  // Replace "yourKey" with the actual key name stored in Local Storage
  const keyName = "orderHistory";
  const data = localStorage.getItem(keyName);
  const lastSentKey = "lastSentOrderHistory";  // Track last sent data

  if (data) {
      const lastSentData = localStorage.getItem(lastSentKey);

      if (data !== lastSentData) { // Only send if data has changed
          fetch("http://localhost:5000/saveData", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ key: keyName, value: data })
          })
          .then(response => response.json())
          .then(result => {
              console.log("Success:", result);
              localStorage.setItem(lastSentKey, data);  // Update last sent data
          })
          .catch(error => console.error("Error:", error));
      } else {
          console.log("No changes detected in order history. Skipping API call.");
      }
  } else {
      console.error("No data found in Local Storage for key:", keyName);
  }

  
});